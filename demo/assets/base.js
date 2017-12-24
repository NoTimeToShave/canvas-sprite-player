// HTMLElements
var underGround1 = document.getElementById( 'underground-1' ),
	underGround1StatusPlay = document.getElementById( 'underground-1-status-play' ),
	underGround1StatusFrame = document.getElementById( 'underground-1-status-frame' );

// SpritePlayer
var playerUnderground = SpritePlayer( {
	autoPlay: true,
	canvas: underGround1,
	drawClock: 10,
	drawUnit: 'fps',
	frameCount: 20,
	frameHeight: 270,
	frameWidth: 480,
	imgSrc: 'assets/underground-traffic.jpg',
	loop: true,
	spritesPerRow: 10,
} );

/*
 * Events
 */
underGround1.addEventListener( 'spriteplay', function() {
	underGround1StatusPlay.innerHTML = 'Playing';
} );

underGround1.addEventListener( 'spriteended', function() {
	// spriteended does not fire if SpritePlayer is set to loop
	underGround1StatusPlay.innerHTML = 'Ended';
} );

underGround1.addEventListener( 'spritepause', function() {
	underGround1StatusPlay.innerHTML = 'Paused';
} );

underGround1.addEventListener( 'spritetimeupdate', function() {
	underGround1StatusFrame.innerHTML = this.currentFrame;
} );

/*
 * Controls
 */
document.getElementById( 'underground-1-play' ).addEventListener( 'click', function() {
	playerUnderground.play();
} );

document.getElementById( 'underground-1-pause' ).addEventListener( 'click', function() {
	playerUnderground.pause();
} );

document.getElementById( 'underground-1-replay' ).addEventListener( 'click', function() {
	playerUnderground.currentFrame = 0;
	playerUnderground.play();
} );

