/**
 * SpritePlayer
 *
 * FPS limiter inspired from here: https://stackoverflow.com/a/19772220
 *     and here: http://jsfiddle.net/chicagogrooves/nRpVD/2/
 *
 * @param object options
 *     @var boolean     autoPlay      Whether to begin loading and playing as soon as the object is defined
 *     @var HTMLElement canvas        The canvas for which to paint
 *     @var integer     drawClock     If drawUnit == 'repaint', the animation will happen as fast as the browser can draw it,
 *                                        which may be too fast. This number represents the number of repaints to skip.
 *                                        For example, setting this to 1 will skip a frame between each repaint,
 *                                        effectively halving the frame rate. 2 will skip two frames, etc ...
 *                                    If drawUnit == 'fps', the animation will attempt to maintain the frames-per-second
 *                                        rate specified by this number. For example, setting this to 10 will make the animation
 *                                        attempt to maintain 10 frames-per-second.
 *     @var string      drawUnit      Possible values: 'repaint' or 'fps'. See drawClock above.
 *     @var integer     frameCount    Number of frames on the sprite sheet
 *     @var integer     frameHeight   Height in pixels of each sprite
 *     @var integer     frameWidth    Width in pixels of each sprite
 *     @var string      imgSrc        URL of sprite sheet image
 *     @var boolean     loop          If true, animation will start over after the last frame
 *     @var integer     spritesPerRow Number of sprites per row on sprite sheet
 * @return object
 */
function SpritePlayer( options ) {
	// Set configuration
	var autoPlay      = options.autoPlay      !== undefined ? options.autoPlay      : false,
		canvas        = options.canvas,
		drawClock     = options.drawClock     !== undefined ? options.drawClock     : 0,
		drawUnit      = options.drawUnit      !== undefined ? options.drawUnit      : 'repaint',
		frameCount    = options.frameCount    !== undefined ? options.frameCount    : 0,
		frameHeight   = options.frameHeight   !== undefined ? options.frameHeight   : 0,
		frameWidth    = options.frameWidth    !== undefined ? options.frameWidth    : 0,
		imgSrc        = options.imgSrc        !== undefined ? options.imgSrc        : '',
		loop          = options.loop          !== undefined ? options.loop          : false,
		spritesPerRow = options.spritesPerRow !== undefined ? options.spritesPerRow : frameCount;
	
	var eventPlay, eventEnded, eventTimeupdate, eventPause, // events
		pub = {
			// Public properties
			currentFrame: 0,                 // current frame
		},                                   // public scope
		reqId,                               // requestAnimationFrame ID
		context = canvas.getContext( '2d' ), // canvas drawing context
		img = new Image(),                   // image object
		clock = {};                          // multi-use timing object

	/******************************
	 * Private
	 *****************************/
	
	/**
	 * Initialize the object and canvas
	 */
	function init() {
		// Custom events
		// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Creating_and_triggering_events
		eventPlay = document.createEvent( 'Event' );
		eventPlay.initEvent( 'spriteplay', true, true );
		eventEnded = document.createEvent( 'Event' );
		eventEnded.initEvent( 'spriteended', true, true );
		eventTimeupdate = document.createEvent( 'Event' );
		eventTimeupdate.initEvent( 'spritetimeupdate', true, true );
		eventPause = document.createEvent( 'Event' );
		eventPause.initEvent( 'spritepause', true, true );

		// Set canvas dimensions to match frame dimensions
		canvas.height = frameHeight;
		canvas.width = frameWidth;
		
		if ( autoPlay ) {
			play();
		}
	}

	/**
	 * Set the image source and load the image
	 *
	 * @param function callback Callback function for when image is complete
	 */
	function loadImage( callback ) {
		// If image is already loaded, move along
		if ( img.complete && img.naturalWidth !== undefined && img.naturalWidth != 0 ) {
			callback();
		} else {
			img.addEventListener( 'load', function() {
				callback();
			} );

			img.src = imgSrc;
		}
	}

	/**
	 * Play animation
	 */
	function play() {
		// If already animating, do nothing
		if ( reqId !== undefined ) {
			return;
		}

		loadImage( function() {
			canvas.dispatchEvent( eventPlay );

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
	}

	/**
	 * Pause animation
	 */
	function pause() {
		// If already paused, do nothing
		if ( reqId === undefined ) {
			return;
		}

		window.cancelAnimationFrame( reqId );
		reqId = undefined;

		canvas.dispatchEvent( eventPause );
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
	 * Display the frame set by pub.currentFrame
	 */
	function draw() {
		// Clear the canvas
		context.clearRect( 0, 0, frameWidth, frameHeight );

		// Draw the animation
		context.drawImage(
			img,
			pub.currentFrame % spritesPerRow * frameWidth,                // X Position of source image.
			Math.floor( pub.currentFrame / spritesPerRow ) * frameHeight, // Y Position of source image.
			frameWidth,
			frameHeight,
			0,
			0,
			frameWidth,
			frameHeight
		);

		// Set read-only currentFrame property of canvas
		canvas.currentFrame = pub.currentFrame;
		canvas.dispatchEvent( eventTimeupdate );
	}
	
	/**
	 * Determine the next frame to play,
	 * or kill the animation if at the end and loop is set to false.
	 */
	function next() {
		// If the current frame index is in range
		if ( pub.currentFrame < frameCount - 1 ) {	
			// Go to the next frame
			pub.currentFrame += 1;
		} else if ( loop ) {
			// Go to beginning
			pub.currentFrame = 0;
		} else {
			// If not looping and animation has ended, be done
			window.cancelAnimationFrame( reqId );
			reqId = undefined;

			canvas.dispatchEvent( eventEnded );
		}
	}


	/******************************
	 * Public methods
	 *****************************/
	pub.play = function() {
		play();
	};

	pub.pause = function() {
		pause();
	};

	/******************************
	 * Initialize
	 *****************************/
	init();

	return pub;
}
