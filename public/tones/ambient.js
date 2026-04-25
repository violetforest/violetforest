var w = window.innerWidth / 2;
var h = window.innerHeight / 2;
var mouseX = Math.random() * 255
var mouseY = Math.random() * 255

StartAudioContext(tones.context);

updateGradient();

document.addEventListener( 'touchstart', onDocumentTouchStart, {passive:false} );
document.addEventListener( 'touchmove', onDocumentTouchMove, {passive:false} );
document.addEventListener( 'mousemove', onDocumentMouseMove, false );

function updateGradient (event) {
	if (event) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
  var gradDeg = (mouseX / 5) + 'Deg';
	var gradStart = 'hsl(' + mouseX + ', 100%, 75%)';
  var gradEnd   = 'hsl(' + mouseY + ', 100%, 50%)';

  document.documentElement.style.setProperty('--grad-deg', gradDeg);
  document.documentElement.style.setProperty('--grad-start', gradStart);
  document.documentElement.style.setProperty('--grad-end', gradEnd);
}

document.addEventListener('mousemove', updateGradient);

document.addEventListener('touchstart', function(event) {
	tones.context.resume();
	if ( event.touches.length > 1 ) {

	  var percentX  = event.touches[ 0 ].pageX;
	  var gradDeg = percentX + 'Deg';
	  var gradStart = 'hsl(' + (percentX - w) + ', 100%, 75%)';
	  var gradEnd   = 'hsl(' + (percentX - h) + ', 50%, 50%)';

		document.documentElement.style.setProperty('--grad-deg', gradDeg);
	  document.documentElement.style.setProperty('--grad-start', gradStart)
	  document.documentElement.style.setProperty('--grad-end', gradEnd)
	}
})	

document.addEventListener('touchmove', function(event) {
	tones.context.resume();
	if ( event.touches.length == 1 ) {

	  var percentX  = event.touches[ 0 ].pageX;
	  var gradDeg = percentX + 'Deg';
	  var gradStart = 'hsl(' + (percentX - w) + ', 100%, 75%)';
	  var gradEnd   = 'hsl(' + (percentX - h) + ', 50%, 50%)';

		document.documentElement.style.setProperty('--grad-deg', gradDeg);
	  document.documentElement.style.setProperty('--grad-start', gradStart)
	  document.documentElement.style.setProperty('--grad-end', gradEnd)
	}
})

function onDocumentTouchStart() {
	tones.context.resume();
}

function onDocumentTouchMove( event ) {
	tones.context.resume();
	if ( event.touches.length == 1 ) {
	  play();
	  var percentX  = event.touches[ 0 ].pageY / 2;

		function play(percentX) {
			var notes = [ "C", "D", "E", "F" ];
		  var note = notes[Math.floor(Math.random() * notes.length)];
		  var octave = Math.floor(Math.random() * 10);
		  tones.play(note, octave);
		}
	}
}

var timestamp = null;
var lastMouseX = null;
var lastMouseY = null;

function onDocumentMouseMove( event ) {
	tones.context.resume();

	 if (timestamp === null) {
	    timestamp = Date.now();
	    lastMouseX = event.clientX;
	    lastMouseY = event.clientY;
	    return;
	  }

    var now = Date.now();
    var dt =  now - timestamp;
    var dx = event.clientX - lastMouseX;
    var dy = event.clientY - lastMouseY;
    var speedX = Math.round(dx / dt * 100);
    var speedY = Math.round(dy / dt * 100);

    timestamp = now;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;

		play();

	function play() {
		var notes = [ "C", "D", "E", "F" ];
	  var note = notes[Math.floor(Math.random() * notes.length)];
	  var octave = Math.floor(Math.random() * 10);
	  tones.play(note, octave);
	}
}