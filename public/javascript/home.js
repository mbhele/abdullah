 // Wait for the video to be loaded before displaying other content
 const video = document.getElementById('video-background');
 const videoContainer = document.getElementById('video-container');

 video.addEventListener('loadeddata', function() {
   videoContainer.style.display = 'block'; // Display the video container
 });