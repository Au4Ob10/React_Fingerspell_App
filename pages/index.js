import React, { useRef, useState, useEffect } from "react"
import * as tf from "@tensorflow/tfjs"
import * as handpose from "@tensorflow-models/handpose"
import Webcam from "react-webcam"
import { drawHand } from "../components/handposeutil"
import * as fp from "fingerpose"
import Handsigns from "../components/handsigns"
import TextareaAutosize from 'react-textarea-autosize'

import {
  Text,
  Heading,
  Button,
  Image,
  Stack,
  Container,
  Box,
  VStack,
  ChakraProvider,
} from "@chakra-ui/react"

import { Signimage, Signpass } from "../components/handimage"

import About from "../components/about"
import Metatags from "../components/metatags"

// import "../styles/App.css"

// import "@tensorflow/tfjs-backend-webgl"

import { RiCameraFill, RiCameraOffFill } from "react-icons/ri"

export default function Home() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  // const mobileCamRef = useRef(null)
  const [confScore, setConfScore] = useState('')
  const [messageBody, setMessageBody] = useState("")
  const [camType, setCamType] = useState("user")
  const [camStream, setCamStream] = useState(null)
  const [camState, setCamState] = useState("on")

  const [sign, setSign] = useState(null)

  let signList = []
  let currentSign = 0

  let gamestate = "started"

  // let net;

  async function runHandpose() {
    const net = await handpose.load()
    _signList()

    // window.requestAnimationFrame(loop);

    setInterval(() => {
      detect(net)
    }, 1600)
  }

  function _signList() {
    signList = generateSigns()
  }

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  function generateSigns() {
    const password = shuffle(Signpass)
    return password
  }

  async function detect(net) {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video
      const videoWidth = webcamRef.current.video.videoWidth
      const videoHeight = webcamRef.current.video.videoHeight

      // Set video width
      webcamRef.current.video.width = videoWidth
      webcamRef.current.video.height = videoHeight
      console.log(webcamRef.current.video)

      // Set canvas height and width
      canvasRef.current.width = videoWidth
      canvasRef.current.height = videoHeight

      // Make Detections
      const hand = await net.estimateHands(video)

      if (hand.length > 0) {
        //loading the fingerpose model
        const GE = new fp.GestureEstimator([
          fp.Gestures.ThumbsUpGesture,
          Handsigns.aSign,
          Handsigns.bSign,
          Handsigns.cSign,
          Handsigns.dSign,
          Handsigns.eSign,
          Handsigns.fSign,
          Handsigns.gSign,
          Handsigns.hSign,
          Handsigns.iSign,
          Handsigns.jSign,
          Handsigns.kSign,
          Handsigns.lSign,
          Handsigns.mSign,
          Handsigns.nSign,
          Handsigns.oSign,
          Handsigns.pSign,
          Handsigns.qSign,
          Handsigns.rSign,
          Handsigns.sSign,
          Handsigns.tSign,
          Handsigns.uSign,
          Handsigns.vSign,
          Handsigns.wSign,
          Handsigns.xSign,
          Handsigns.ySign,
          Handsigns.zSign,
        ])

        const estimatedGestures = await GE.estimate(hand[0].landmarks, 6.5)
        // document.querySelector('.pose-data').innerHTML =JSON.stringify(estimatedGestures.poseData, null, 2);

        if (
          estimatedGestures.gestures !== undefined &&
          estimatedGestures.gestures.length > 0
        ) {
          const confidence = estimatedGestures.gestures.map(p => p.confidence)
          const maxConfidence = confidence.indexOf(
            Math.max.apply(undefined, confidence)
          )

          //setting up game state, looking for thumb emoji
          if (gamestate !== "played") {
            _signList()
            gamestate = "played"
            document.getElementById("detectionStatus").classList.add("play")
            document.querySelector(".tutor-text").innerText =
              "make a hand gesture based on letter shown below"
          } else if (gamestate === "played") {
            document.querySelector("#app-title").innerText = ""

            //looping the sign list
            if (currentSign === signList.length) {
              _signList()
              currentSign = 0
              return
            }

            // console.log(signList[currentSign].src.src)

            //game play state

            if (
              signList[currentSign].alt ===
              estimatedGestures.gestures[maxConfidence].name
            ) {
              currentSign++
            }

            // setSign(estimatedGestures.gestures[maxConfidence].name)

            let letterConfidence =
              estimatedGestures.gestures[maxConfidence].score
            let currLetter = estimatedGestures.gestures[maxConfidence].name

            if (currLetter !== "thumbs_up") {
              setMessageBody(messageBody => messageBody + currLetter)
              setConfScore(confScore => confScore + letterConfidence )
            }
          } else if (gamestate === "finished") {
            return
          }
        }
      }
      // Draw hand lines
      const ctx = canvasRef.current.getContext("2d")
      drawHand(hand, ctx)
    }
  }

  //   if (sign) {
  //     console.log(sign, Signimage[sign])
  //   }

  useEffect(() => {
    runHandpose()
  }, [])

  function turnOffCamera() {
    if (camState === "on") {
      setCamState("off")
    } else {
      setCamState("on")
    }
  }

  const setCamTypeFunc = () => {
    camType === "user" ? setCamType("environment") : setCamState("user")
  }

  useEffect(() => {
    const cameraStream = async () => {
      try {
        const constraints = { video: { facingMode: camType } }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        setCamStream(stream)
      } catch (e) {
        console.error(`Unable to access stream, Error: ${e}`)
      }
    }
    cameraStream()
  }, [])

  // useEffect(() => {
  //   const enableStream = async () => {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: camType } })
  //       if (mobileCamRef.current) {
  //         mobileCamRef.current.srcObj = stream
  //       }
  //     } catch (err) {
  //       console.error("Error accessing media devices:", err)
  //     }
  //   }

  //   enableStream()

  //   return () => {
  //     if (mobileCamRef.current && mobileCamRef.current.srcObj) {
  //       const stream = mobileCamRef.current.srcObj;
  //       const tracks = stream.getTracks();
  //       tracks.forEach(track => track.stop());
  //     }
  //   }
  // }, [])

  return (
    <ChakraProvider>
      <Metatags />
      <Box bgColor="#5784BA">
        <Container centerContent maxW="xl" height="100vh" pt="0" pb="0">
          <Button onClick={setCamTypeFunc} />
          <Button onClick={setCamState} />
          <VStack spacing={4} align="center">
            <Box h="20px"></Box>
            <Heading
              as="h3"
              size="md"
              className="tutor-text"
              color="white"
              textAlign="center"
            ></Heading>
            <Box h="20px"></Box>
          </VStack>

          <Heading
            as="h1"
            size="lg"
            id="app-title"
            color="white"
            textAlign="center"
          >
            🧙‍♀️ Loading the Magic 🧙‍♂️
          </Heading>

          <Box id="webcam-container">
            {camState === "on" ? (
              <Webcam id="webcam" ref={webcamRef} />
            ) : (
              <div id="webcam" background="black"></div>
            )}

            {camStream && (
              <video
                autoPlay
                playsInline
                ref={video => {
                  if (video) video.srcObject = camStream
                }}
              />
            )}

            <div
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                right: "calc(50% - 50px)",
                bottom: 100,
                textAlign: "-webkit-center",
              }}
            >
              <Stack
                id="start-button"
                spacing={4}
                direction="row"
                align="center"
              >
  
              </Stack>
              <Text color="white" fontSize="sm" mb={1}>
                detected gestures
              </Text>
              <Box>
         
          {/* <Text id="msgText" color="white" fontSize="sm" mb={1}>
                {messageBody}
              </Text> */}
          </Box>
             
            </div>
          </Box>
          <TextareaAutosize name="signText" id="msgText"  minRows={5}  style={{position: 'fixed', bottom: "10px"}}defaultValue={messageBody}/>
         <Text>{confScore}</Text>

          <canvas id="gesture-canvas" ref={canvasRef} style={{}} />
          

          <div id="detectionStatus"></div>
          {/* <pre className="pose-data" color="white" style={{position: 'fixed', top: '150px', left: '10px'}} >Pose data</pre> */}
        </Container>
       
      </Box>
    
    </ChakraProvider>
  )
}
