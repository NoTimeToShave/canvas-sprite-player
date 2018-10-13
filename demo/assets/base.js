// HTMLElements
var underground1 = document.getElementById( 'underground-1' ),
	underground1StatusPlay = document.getElementById( 'underground-1-status-play' ),
	underground1StatusFrame = document.getElementById( 'underground-1-status-frame' );

// SpritePlayer
var playerUndergroundFrameCount = 20,
	playerUnderGround1 = SpritePlayer( {
		autoPlay: true,
		canvas: underground1,
		drawClock: 10,
		drawUnit: 'fps',
		frameCount: playerUndergroundFrameCount,
		frameHeight: 270,
		frameWidth: 480,
		imgSrc: 'assets/underground-traffic.jpg',
		loop: true,
		spritesPerRow: 10,
} );

/*
 * Events
 */
underground1.addEventListener( 'spriteplay', function() {
	underground1StatusPlay.innerHTML = 'Playing';
} );

underground1.addEventListener( 'spriteended', function() {
	// spriteended does not fire if SpritePlayer is set to loop
	underground1StatusPlay.innerHTML = 'Ended';
} );

underground1.addEventListener( 'spritepause', function() {
	underground1StatusPlay.innerHTML = 'Paused';
} );

underground1.addEventListener( 'spritetimeupdate', function() {
	underground1StatusFrame.innerHTML = ( this.currentFrame + 1 ) + ' of ' + playerUndergroundFrameCount;
} );

/*
 * Controls
 */
document.getElementById( 'underground-1-play' ).addEventListener( 'click', function() {
	playerUnderGround1.play();
} );

document.getElementById( 'underground-1-pause' ).addEventListener( 'click', function() {
	playerUnderGround1.pause();
} );

document.getElementById( 'underground-1-replay' ).addEventListener( 'click', function() {
	playerUnderGround1.currentFrame = 0;
	playerUnderGround1.play();
} );

