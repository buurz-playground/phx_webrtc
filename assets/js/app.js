import "phoenix_html"
import socket from "./socket"
import {Presence} from "phoenix"
import Peer from "simple-peer"
import getUserMedia from "getusermedia"

let channel;
let pc1
let globalCallChannel
let callOff = false

let startButton = document.getElementById('startButton')
let hangupButton = document.getElementById('hangupButton')
startButton.disabled = false
hangupButton.disabled = true
startButton.onclick = () => start()
hangupButton.onclick = () => hangup(channel)


let start = () => {
  // TODO : when update
  if (!callOff){
    joinChannel();
  }
}

let hangup = (channel) => {
  if (pc1) {
    pc1.signal('close')
    pc1.destroy()
  }
  hangupButton.disabled = true
  callOff = true
}


let trace = (text) => {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}

// Now that you are connected, you can join channels with a topic:

let updateStatus = (status) => {
  let myVideo = document.getElementById('status')
  myVideo.textContent = status
}
updateStatus("Ожидаем подключения пользователя")

let sessionToken = window.sessionToken
if(!sessionToken) {
  updateStatus("Ссылка не верна, пожалуйста попробуйте еще раз.")
}

let joinChannel = () => {
  if(!Peer.WEBRTC_SUPPORT) {
    updateStatus("Sorry your browser is not supported, please use Chrome or Firefox")
    return
  }

  channel = socket.channel("audio_calls:" + sessionToken, {})

  channel.join()
    .receive("ok", resp => { console.log("Joined users successfully", resp) })
    .receive("error", resp => { console.log("Unable to join", resp) })

  channel.on('bye', payload => {
    channel.leave()
    channel = null
  })

  channel.on('chat_start', payload => {
    if(payload.users.includes(window.user_id)) {
      updateStatus("Пользователь найден, подключение...")

      let otherUser = payload.users.filter((id) => window.user_id != id)[0]
      channel.leave()
      channel = null

      let callChannel = socket.channel(payload.room)
      globalCallChannel = callChannel

      callChannel.join()
        .receive("ok", resp => { console.log("Joined  callChannel successfully", resp) })
        .receive("error", resp => { console.log("Unable to join", resp) })

      getUserMedia({video: true, audio: true}, (err, stream) => {
        if(err) {
          console.log("getUserMedia Error", err)
          updateStatus("There was a problem with your WebCam/Microphone. Please check your settings and try again.")
          joinChannel();
          return
        }

        let myVideo = document.getElementById('my-video')
        let video = document.getElementById('caller-video')
        let vendorURL = window.URL || window.webkitURL
        myVideo.src = vendorURL ? vendorURL.createObjectURL(stream) : stream
        myVideo.muted = true
        myVideo.play()

        var peer = new Peer({ initiator: payload.initiator == window.user_id, trickle: true, stream: stream, config: {iceServers: [{urls:'stun:stun.l.google.com:19302'}, {urls:'stun:stun1.l.google.com:19302'}, {urls:'stun:stun2.l.google.com:19302'}, {urls:'stun:stun3.l.google.com:19302'}, {urls:'stun:stun4.l.google.com:19302'}]}})

        pc1 = peer

        peer.on('error', err => {
          try {
            callChannel.leave()
            callChannel = null
            peer = null
            myVideo.removeAttribute("src");
            myVideo.load();
            video.removeAttribute("src");
            video.load();
            updateStatus("Пользователь отключился или произошел сбой в сети.")
            peer.destroy()
            startButton.disabled = false
            hangupButton.disabled = true
            joinChannel()
          } catch(err) {
            console.log('Peer on error: ', err)
          }
        })

        peer.on('close', () => {
          try {
            callChannel.leave()
            callChannel = null
            peer = null
            myVideo.removeAttribute("src");
            myVideo.load();
            video.removeAttribute("src");
            video.load();
            startButton.disabled = false
            hangupButton.disabled = true
            video.src = null
            updateStatus("Пользователь отключился или произошел сбой в сети.")
            joinChannel()
          } catch(err) {
            console.log('Peer on close error: ', err)
          }
        })

        peer.on('signal', signal => { callChannel.push('signal', signal) })
        callChannel.on(`signal:${otherUser}`, signal => { peer.signal(signal) })
        peer.on('connect', () => console.log("CONNECT"))
        peer.on('stream', (callerStream) => {
          // got remote video stream, now let's show it in a video tag
          video = document.getElementById('caller-video')
          video.src = vendorURL ? vendorURL.createObjectURL(callerStream) : callerStream
          video.play()
          updateStatus("Audio Streaming")
          startButton.disabled = true
          hangupButton.disabled = false
        })
      })
    }
  })
}

start();
