let handleFail = function(err){
    console.log("Error : ", err);
};
const video = document.getElementById('me')
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(addVideoStream)
let remoteContainer= document.getElementById("remote-container");
function addVideoStream(streamId){
    let streamDiv=document.createElement("div"); // Create a new div for every stream
    streamDiv.id=streamId;                       // Assigning id to div
    streamDiv.style.transform="rotateY(180deg)"; // Takes care of lateral inversion (mirror image)
    remoteContainer.appendChild(streamDiv);      // Add new div to container
}
function removeVideoStream (evt){
    let stream = evt.stream;
    stream.stop();
    let remDiv=document.getElementById(stream.getId());
    remDiv.parentNode.removeChild(remDiv);
    console.log("Remote stream is removed " + stream.getId());
}
let client = AgoraRTC.createClient({
    mode: 'live',
    codec: "h264"
});
client.init("c51e85472f2341409a130bdca46509b1",() => console.log("AgoraRTC client initialized") ,handleFail);
client.join(null,"any-channel",null, (uid)=>{
    let localStream = AgoraRTC.createStream({
        streamID: uid,
        audio: true,
        video: true,
        screen: false
    });
    localStream.init(function() {
        localStream.play('me');
        client.publish(localStream, handleFail);
    },handleFail);
},handleFail);
client.on('stream-added', function (evt) {
    client.subscribe(evt.stream, handleFail);
});
client.on('stream-subscribed', function (evt) {
    let stream = evt.stream;
    addVideoStream(stream.getId());
    stream.play(stream.getId());
});
client.on('stream-removed',removeVideoStream);
client.on('peer-leave',removeVideoStream);
video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    faceapi.draw.drawDetections(canvas, resizedDetections)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
  }, 100)
})
