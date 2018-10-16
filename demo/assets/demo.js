// HTMLElements
var underground1 = document.getElementById( 'underground-1' ),
	underground1StatusPlay = document.getElementById( 'underground-1-status-play' ),
	underground1StatusFrame = document.getElementById( 'underground-1-status-frame' ),
	underground2 = document.getElementById( 'underground-2' ),
	underground2StatusPlay = document.getElementById( 'underground-2-status-play' ),
	underground2StatusFrame = document.getElementById( 'underground-2-status-frame' );

// SpritePlayer
var playerUnderGround1 = SpritePlayer( {
		autoPlay: true,
		canvas: underground1,
		drawClock: 10,
		drawUnit: 'fps',
		frameCount: 20,
		frameHeight: 270,
		frameWidth: 480,
		imgSrc: 'assets/underground-traffic.jpg',
		loop: true,
		spritesPerRow: 10,
	} );
// SpritePlayer
var playerUnderGround2 = SpritePlayer( {
		autoPlay: true,
		canvas: underground2,
		drawClock: 10,
		drawUnit: 'fps',
		frameCount: 20,
		frameHeight: 270,
		frameWidth: 480,
		//imgSrc: 'assets/underground-traffic.jpg',
		imgSeqSrc: 'assets/underground-traffic-sequence.txt',
		imgSeqDel: ' | ',
		loop: false,
		//spritesPerRow: 10,
	} );

/*
 * Events
 */
playerUnderGround1.on( 'spriteplay', function( e ) {
	underground1StatusPlay.innerHTML = 'Playing';
} );

playerUnderGround1.on( 'spriteended', function( e ) {
	// spriteended does not fire if SpritePlayer is set to loop
	underground1StatusPlay.innerHTML = 'Ended';
} );

playerUnderGround1.on( 'spritepause', function( e ) {
	underground1StatusPlay.innerHTML = 'Paused';
} );

playerUnderGround1.on( 'spritetimeupdate', function( e ) {
	underground1StatusFrame.innerHTML = ( this.currentFrame + 1 ) + ' of ' + this.config.frameCount;
} );

playerUnderGround2.on( 'spriteplay', function( e ) {
	underground2StatusPlay.innerHTML = 'Playing';
} );

playerUnderGround2.on( 'spriteended', function( e ) {
	// spriteended does not fire if SpritePlayer is set to loop
	underground2StatusPlay.innerHTML = 'Ended';
} );

playerUnderGround2.on( 'spritepause', function( e ) {
	underground2StatusPlay.innerHTML = 'Paused';
} );

playerUnderGround2.on( 'spritetimeupdate', function( e ) {
	underground2StatusFrame.innerHTML = ( this.currentFrame + 1 ) + ' of ' + this.config.frameCount;
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
	playerUnderGround1.setCurrentFrame(0);
	playerUnderGround1.play();
} );

document.getElementById( 'underground-1-half-second' ).addEventListener( 'click', function() {
	playerUnderGround1.setCurrentTime(.5);
} );

document.getElementById( 'underground-2-play' ).addEventListener( 'click', function() {
	playerUnderGround2.play();
} );

document.getElementById( 'underground-2-pause' ).addEventListener( 'click', function() {
	playerUnderGround2.pause();
} );

document.getElementById( 'underground-2-replay' ).addEventListener( 'click', function() {
	playerUnderGround2.setCurrentFrame(0);
	playerUnderGround2.play();
} );

document.getElementById( 'underground-2-half-second' ).addEventListener( 'click', function() {
	playerUnderGround2.setCurrentTime(.5);
} );

