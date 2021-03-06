/**
 * SpritePlayer
 *
 * FPS limiter inspired from here: https://stackoverflow.com/a/19772220
 *     and here: http://jsfiddle.net/chicagogrooves/nRpVD/2/
 *
 * @param object options
 *     @var boolean     autoPlay        Whether to begin loading and playing as soon as the object is defined.
 *     @var HTMLElement canvas          The canvas for which to paint
 *     @var boolean     clearBeforeDraw Clear canvas before drawing a new frame.
 *     @var integer     drawClock       If drawUnit == 'repaint', the animation happens on requestAnimationFrame, 
 *                                         will happen as fast as the browser can draw it, which may be too fast.
 *                                          This number represents the number of ticks to skip.
 *                                          For example, setting this to 1 will skip a tick between each repaint,
 *                                          effectively halving the frame rate. 2 will skip two ticks, etc ...
 *                                      If drawUnit == 'fps', the animation will attempt to maintain the frames-per-second
 *                                          rate specified by this number. For example, setting this to 10 will make the animation
 *                                          attempt to maintain 10 frames-per-second.
 *     @var string      drawUnit        Possible values: 'repaint' or 'fps'. See drawClock above.
 *     @var integer     frameCount      Number of frames on the sprite sheet
 *     @var integer     frameHeight     Height in pixels of each sprite
 *     @var integer     frameWidth      Width in pixels of each sprite
 *     @var string      imgSeqDel       Delimiter for Base64 image sequence
 *     @var string      imgSeqSrc       URL of Base64 image sequence
 *     @var string      imgSrc          URL of sprite sheet image
 *     @var boolean     loop            If true, animation will start over after the last frame
 *     @var integer     spritesPerRow   Number of sprites per row on sprite sheet
 * @return object
 */
function SpritePlayer( options ) {
	// Configuration from options
	var autoPlay        = options.autoPlay        !== undefined ? options.autoPlay        : false,
		canvas          = options.canvas,
		clearBeforeDraw = options.clearBeforeDraw !== undefined ? options.clearBeforeDraw : false,
		drawClock       = options.drawClock       !== undefined ? options.drawClock       : 0,
		drawUnit        = options.drawUnit        !== undefined ? options.drawUnit        : 'repaint',
		frameCount      = options.frameCount      !== undefined ? options.frameCount      : 0,
		frameHeight     = options.frameHeight     !== undefined ? options.frameHeight     : 0,
		frameWidth      = options.frameWidth      !== undefined ? options.frameWidth      : 0,
		imgSeqDel       = options.imgSeqDel       !== undefined ? options.imgSeqDel       : '|',
		imgSeqSrc       = options.imgSeqSrc       !== undefined ? options.imgSeqSrc       : '',
		imgSrc          = options.imgSrc          !== undefined ? options.imgSrc          : '',
		loop            = options.loop            !== undefined ? options.loop            : false,
		spritesPerRow   = options.spritesPerRow   !== undefined ? options.spritesPerRow   : frameCount;
	
	// Private variables
	var callbacks        = {},                        // event callbacks. based on Emitter: https://github.com/component/emitter
		clock            = {},                        // multi-use timing object
		context          = canvas.getContext( '2d' ), // canvas drawing context
		currentFrame     = 0,                         // current frame in the animation
		draw             = null,                      // abstract draw function. set dynamically based on mode
		img              = new Image(),               // image object that's drawn on canvas
		imgSeq           = [],                        // array of base64 image strings
		mode             = '',                        // 'sprite' or 'seqbase64'
		reqId            = null,                      // requestAnimationFrame ID
		seqListenerAdded = false;                     // if the mode is seqbase64 and the img loaded event has been set
	
	// Public scope
	var pub = {
			config       : options, // read-only
			currentFrame : 0,       // read-only
			currentTime  : 0,       // read-only
		};

	/********************
	 *
	 * Public methods
	 *
	 *******************/

	/**
	 * Play animation
	 */
	pub.play = function() {
		// If already animating, do nothing
		if ( null !== reqId ) {
			return;
		}

		loadAsset( function() {
			pub.emit( 'spriteplay' );

			if ( 'repaint' == drawUnit ) {
				// Init repaint loop
				clock.tick = 0;

				loopRepaint();
			} else if ( 'fps' == drawUnit ) {
				// Init FPS loop
				clock.fpsInterval = 1000 / drawClock;
				clock.fpsThen = window.performance.now();
				clock.fpsStartTime = clock.fpsThen;
				
				loopFPS();
			}
		} );
	};

	/**
	 * Pause animation
	 */
	pub.pause = function() {
		// If already paused, do nothing
		if ( null === reqId ) {
			return;
		}

		window.cancelAnimationFrame( reqId );
		reqId = null;

		pub.emit( 'spritepause' );
	};

	/**
	 * Set an event listener
	 *
	 * @param string   event the event to listen for
	 * @param function fn    the callback function
	 */
	pub.on = function( event, fn ) {
		( callbacks[ '$' + event ] = callbacks[ '$' + event ] || [] ).push( fn );
	};

	/**
	 * Remove an event listener/all event listeners.
	 * If called w/o arguments, delete all event listeners
	 * If called w/o a function, will remove all callbacks for an event
	 *
	 * @param string   event (optional) the event to listen for
	 * @param function fn    (optional) the callback function
	 */
	pub.off = function( event, fn ) {
		// all
		if ( 0 == arguments.length ) {
			callbacks = {};
			return;
		}

		// specific event
		var _callbacks = callbacks[ '$' + event ];
		if ( ! _callbacks ) {
			return;
		}

		// remove all handlers
		if ( 1 == arguments.length ) {
			delete callbacks[ '$' + event ];
			return;
		}

		// remove specific handler
		var cb;
		for ( var i = 0; i < _callbacks.length; i++ ) {
			cb = _callbacks[ i ];
			if ( cb === fn || cb.fn === fn ) {
				_callbacks.splice( i, 1 );
				break;
			}
		}

		// Remove event specific arrays for event types that no
		// one is subscribed for to avoid memory leak.
		if ( _callbacks.length === 0 ) {
		  delete callbacks[ '$' + event ];
		}
	};

	/**
	 * Trigger an event, invoking all registered callbacks
	 * 
	 * @param string event the event to trigger
	 */
	pub.emit = function( event ) {
		var args = [].slice.call( arguments, 1 ),
			_callbacks = callbacks[ '$' + event ];
		args.unshift( event ); // Add event string to return args

		if ( _callbacks ) {
			_callbacks = _callbacks.slice( 0 );
			for ( var i = 0, len = _callbacks.length; i < len; ++i ) {
				_callbacks[ i ].apply( pub, args );
			}
		}
	};

	/**
	 * Set the sprite to a specific frame.
	 * Note that frame counts start at 0.
	 *
	 * @param integer frame frame number
	 */
	pub.setCurrentFrame = function( frame ) {
		currentFrame = frame;
		draw();
		next();
	};

	/**
	 * Set the sprite to a specific time.
	 * This is an approximation of video currentTime.
	 * It uses the fps of the animation to determine frame.
	 *
	 * @param float time time in seconds
	 */
	pub.setCurrentTime = function( time ) {
		if ( 'repaint' == drawUnit ) {
			console.error( 'Cannot set current time with drawUnit: repaint' );
			return;
		}

		currentFrame = Math.floor( time * drawClock );
		draw();
		next();
	};

	/********************
	 *
	 * Private functions
	 *
	 *******************/

	 /**
	 * Load the asset which will either be a sprite or a base64 encoded sequence
	 *
	 * @param function callback Callback function for when image is complete
	 */
	function loadAsset( callback ) {
		if ( 'sprite' == mode ) {
			// If image is already loaded, move along
			if ( img.complete && img.naturalWidth !== undefined && img.naturalWidth != 0 ) {
				callback();
			} else {
				img.addEventListener( 'load', function() {
					callback();
				} );

				img.src = imgSrc;
			}
		} else if ( 'seqbase64' == mode ) {
			// If sequence is already loaded, move along
			if ( imgSeq.length > 0 ) {
				callback();
			} else {
				// Load sequence file via XMLHttpRequest()
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function () {
					if ( xhr.readyState === 4 ) {
						if ( xhr.status === 200 ) {
							// Create array of images from base64 text
							imgSeq = xhr.responseText.split( imgSeqDel );
							callback();
						} else {
							console.error( 'Could not load ' + imgSeqSrc + ' -  Status: ' + xhr.status );
						}
					}
				};

				xhr.open( 'GET', imgSeqSrc );
				xhr.send();
			}
		}
	}

	/**
	 * Animation loop for 'repaint'
	 */
	function loopRepaint() {
		reqId = window.requestAnimationFrame( loopRepaint );

		// Only draw when the clock.tick === 0
		if ( 0 === clock.tick ) {
			draw();
			next();
		}

		clock.tick += 1;

		// If the tick is greater than the clock interval,
		// reset clock tick to zero so the next tick will render.
		if ( clock.tick > drawClock ) {
			clock.tick = 0;
		}
	}

	/**
	 * Animation loop for 'fps'
	 */
	function loopFPS( newtime ) {
		reqId = window.requestAnimationFrame( loopFPS );

		clock.fpsNow = newtime;
		clock.fpsElapsed = clock.fpsNow - clock.fpsThen;

		// Only draw when an appropriate FPS has passed
		if ( clock.fpsElapsed > clock.fpsInterval ) {
			clock.fpsThen = clock.fpsNow - ( clock.fpsElapsed % clock.fpsInterval );

			draw();
			next();
		}
	}

	/**
	 * Display the sprite frame set by currentFrame.
	 * The draw() function will be set to either _drawSprite() or _drawSequence()
	 */
	function _drawSprite() {
		// Draw the sprite
		if ( clearBeforeDraw ) {
			context.clearRect( 0, 0, frameWidth, frameHeight );
		}

		context.drawImage(
			img,
			currentFrame % spritesPerRow * frameWidth,                // X Position of source image.
			Math.floor( currentFrame / spritesPerRow ) * frameHeight, // Y Position of source image.
			frameWidth,      // only grab frame width from full sprite sheet
			frameHeight,     // only grab frame height from full sprite sheet
			0,               // X Position on canvas
			0,               // Y Position on canvas
			frameWidth,      // draw size width on canvas
			frameHeight      // draw size height on canvas
		);

		if ( 'fps' == drawUnit ) {
			pub.currentTime = currentFrame / drawClock;
		}

		pub.currentFrame = currentFrame;
		pub.emit( 'spritetimeupdate' );
	}

	/**
	 * Display the sequence frame set by currentFrame
	 * The draw() function will be set to either _drawSprite() or _drawSequence()
	 */
	function _drawSequence() {
		// Draw the image in sequence
		if ( ! seqListenerAdded ) {
			img.addEventListener( 'load', function() {
				if ( clearBeforeDraw ) {
					context.clearRect( 0, 0, frameWidth, frameHeight );
				}

				context.drawImage( img, 0, 0 );

				// Set this to prevent more than one listener from being added
				seqListenerAdded = true;
			} );
		}
		// Set the image source. The above 'load' listener handles the drawing
		img.src = imgSeq[ currentFrame ];

		if ( 'fps' == drawUnit ) {
			pub.currentTime = currentFrame / drawClock;
		}

		pub.currentFrame = currentFrame;
		pub.emit( 'spritetimeupdate' );
	}
	
	/**
	 * Determine the next frame to play,
	 * or kill the animation if at the end and loop is set to false.
	 */
	function next() {
		// If the current frame index is in range
		if ( currentFrame < frameCount - 1 ) {	
			// Advance currentFrame by 1
			currentFrame += 1;
		} else if ( loop ) {
			// Go to beginning
			currentFrame = 0;
		} else {
			// If not looping and animation has ended, be done
			window.cancelAnimationFrame( reqId );
			reqId = null;
			
			pub.emit( 'spriteended' );
		}
	}

	/******************************
	 * Initialize
	 *****************************/
	
	// Set mode and draw function
	if ( imgSrc ) {
		mode = 'sprite';
		draw = _drawSprite;
	} else if ( imgSeqSrc ) {
		mode = 'seqbase64';
		draw = _drawSequence;
	}

	// Set the canvas dimensions
	canvas.height = frameHeight;
	canvas.width = frameWidth;

	// Public read-only properties
	pub.config = options;
	pub.currentFrame = 0;
	pub.currentTime = 0;
	
	if ( autoPlay ) {
		pub.play();
	}

	return pub;
}
