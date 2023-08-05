import {
  calculateAccuracy,
  getAngle,
  scoreToPercent,
  checkAngles,
  generateFeedback
} from './accuracy.js'

let model, webcam, ctx, labelContainer, maxPredictions
let inputExercise, inputReps, inputSets

let models = {
  squat: 'https://teachablemachine.withgoogle.com/models/VjoSZwCaL/',
  lateralraise: 'https://teachablemachine.withgoogle.com/models/EPi--BmlM/',
  'legraise-left': 'https://teachablemachine.withgoogle.com/models/wDXxvzk9i/',
  'legraise-right': 'https://teachablemachine.withgoogle.com/models/wDXxvzk9i/',
  'lunge-left': 'https://teachablemachine.withgoogle.com/models/IJsMr6OiC/',
  'lunge-right': 'https://teachablemachine.withgoogle.com/models/IJsMr6OiC/'
}

window.onload = function () {
  prepareData()

  $('#inputReps').html(inputReps)
  init()
}

function prepareData () {
  window.localStorage.setItem('totalScore', 0)
  window.localStorage.setItem('minScore', 11)
  window.localStorage.setItem('maxScore', -1)
  window.localStorage.setItem('minAccuracy', 101)
  window.localStorage.setItem('maxAccuracy', -1)
  window.localStorage.setItem('feedbackAngles', JSON.stringify([0, 0]))

  let setNum = Number(window.localStorage.getItem('setNum'))
  window.localStorage.setItem('setNum', setNum ? setNum + 1 : 1)

  // test를 위한 추가
  window.localStorage.setItem('inputExercise', 'lateralraise') // 운동 변경 시 마지막 인자값 수정
  window.localStorage.setItem('inputReps', 5) // 한 세트당 반복 횟수 변경 시 마지막 인자값 수정
  window.localStorage.setItem('inputSets', 3) // 총 세트수 변경 시 마지막 인자값 수정
  //

  inputExercise = window.localStorage.getItem('inputExercise')
  inputReps = Number(window.localStorage.getItem('inputReps'))
  inputSets = Number(window.localStorage.getItem('inputSets'))
}

async function init () {
  const modelPath = models[inputExercise] + 'model.json'
  const metadataPath = models[inputExercise] + 'metadata.json'

  model = await tmPose.load(modelPath, metadataPath)
  maxPredictions = model.getTotalClasses()

  const size = 500
  const flip = true
  webcam = new tmPose.Webcam(size, size, flip)
  await webcam.setup()
  await webcam.play()
  window.requestAnimationFrame(loop)

  const canvas = document.getElementById('cam-canvas')
  canvas.width = size
  canvas.height = size
  ctx = canvas.getContext('2d')

  labelContainer = document.getElementById('label-container')

  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement('div'))
  }
}

async function loop (timestamp) {
  webcam.update()
  await predict()
  window.requestAnimationFrame(loop)
}

let status = inputExercise + '-prepare'
let count = 0

let flag = true
let userAngles

async function predict () {
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas)
  const prediction = await model.predict(posenetOutput)

  if (flag) {
    prediction[0].probability = 1.0
    flag = false
  }

  if (prediction[0].probability.toFixed(2) == 1.0) {
    if (status == inputExercise) {
      count++
      $('#counter').html(count)

      userAngles = checkAngles(inputExercise, userAngles)
      window.localStorage.setItem('feedbackAngles', saveAngles())
      // test를 위한 추가
      console.log('angle: ' + userAngles)
      //
      calculateAccuracy(inputExercise, userAngles)
      userAngles.length = 0
    }
    status = inputExercise + '-prepare'
  } else if (
    prediction[1].probability.toFixed(2) == 1.0 ||
    (prediction[2] ? prediction[2].probability.toFixed(2) == 1.0 : false)
  ) {
    inputExercise =
      prediction[1].probability.toFixed(2) == 1.0
        ? prediction[1].className
        : prediction[2].className
    window.localStorage.setItem('inputExercise', inputExercise)
    status = inputExercise

    const poseCopy = _.cloneDeep(pose)
    userAngles = _.cloneDeep(getAngle(inputExercise, poseCopy))
  }

  if (count == inputReps) {
    scoreToPercent()
    generateFeedback()

    // window.location.replace(
    //   document.location.href.replace('exercise.html', 'analysis.html')
    // )
    count = 0
  }

  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ': ' + prediction[i].probability.toFixed(2)
    labelContainer.childNodes[i].innerHTML = classPrediction
  }

  drawPose(pose)
}

function drawPose (pose) {
  if (webcam.canvas) {
    ctx.drawImage(webcam.canvas, 0, 0)

    if (pose) {
      const minPartConfidence = 0.5
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx)
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx)
    }
  }
}

function saveAngles () {
  let feedbackAngles = JSON.parse(window.localStorage.getItem('feedbackAngles'))

  feedbackAngles.forEach((angle, index) => {
    feedbackAngles[index] = Number((angle + userAngles[index]).toFixed(2))
  })

  return JSON.stringify(feedbackAngles)
}
