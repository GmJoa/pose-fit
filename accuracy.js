const index = {
  leftShoulder: 5,
  rightShoulder: 6,
  leftElbow: 7,
  rightElbow: 8,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16
}

// 1.스쿼트 왼쪽 상체, 2.왼쪽 하체
// 1.래터럴 레이즈 왼쪽 팔, 2.오른쪽 팔
// 1.레그레이즈 오른쪽(왼발 수행) 상체, 2.왼쪽 하체
// 1.레그레이즈 왼쪽(오른발 수행) 상체, 2.오른쪽 하체
// 1.런지 왼쪽 상체, 2.왼쪽 하체
// 1.런지 오른쪽 상체, 2.오른쪽 하체

const angleIndex = {
  squat: {
    index1: [index.rightHip, index.rightShoulder, index.rightKnee],
    index2: [index.rightKnee, index.rightHip, index.rightAnkle]
  },

  lateralraise: {
    index1: [index.rightShoulder, index.rightHip, index.rightElbow],
    index2: [index.leftShoulder, index.leftHip, index.leftElbow]
  },

  'legraise-left': {
    index1: [index.leftHip, index.leftShoulder, index.leftKnee],
    index2: [index.rightHip, index.rightKnee]
  },

  'legraise-right': {
    index1: [index.rightHip, index.rightShoulder, index.rightKnee],
    index2: [index.leftHip, index.leftKnee]
  },

  'lunge-left': {
    index1: [index.rightHip, index.rightShoulder, index.rightKnee],
    index2: [index.rightKnee, index.rightHip, index.rightAnkle]
  },

  'lunge-right': {
    index1: [index.leftHip, index.leftShoulder, index.leftKnee],
    index2: [index.leftKnee, index.leftHip, index.leftAnkle]
  }
}

// 올바른 각도, 각도 간격, 최소, 최대
const scoreInfo = {
  squat: {
    upper: [70, 10, 10, 100],
    lower: [85, 5, 30, 140]
  },

  lateralraise: {
    left: [90, 5, 45, 110],
    right: [90, 5, 45, 110]
  },

  'legraise-left': {
    upper: [180, 5, 150, 185],
    lower: [50, 5, 30, 90]
  },

  'legraise-right': {
    upper: [180, 5, 150, 185],
    lower: [50, 5, 30, 90]
  },

  'lunge-left': {
    upper: [90, 5, 70, 110],
    lower: [90, 5, 60, 110]
  },

  'lunge-right': {
    upper: [90, 5, 70, 110],
    lower: [90, 5, 60, 110]
  }
}

// min: true(스쿼트, 런지), max: false(레그레이즈, 래터럴 레이즈)
const angleFlag = {
  squat: true,
  lateralraise: false,
  'legraise-left': false,
  'legraise-right': false,
  'lunge-left': true,
  'lunge-right': true
}

const CORRECT_ANGLE = 0
const INTERVAL = 1
const MIN_ANGLE = 2
const MAX_ANGLE = 3
const PERFECT_SCORE = 10

let points = new Array()
let angles = new Array()

function getPoint (pose) {
  points.length = 0

  for (let i = 0; i < 17; i++) {
    points.push([0, 0])
  }

  for (let part in index) {
    points[index[part]] = [
      pose.keypoints[index[part]].position.x,
      pose.keypoints[index[part]].position.y
    ]
  }
}

export function getAngle (inputExercise, pose) {
  getPoint(pose)

  for (let key in angleIndex[inputExercise]) {
    let idx = angleIndex[inputExercise][key]

    let cx = points[idx[0]][0]
    let cy = points[idx[0]][1]
    let x1 = points[idx[1]][0]
    let y1 = points[idx[1]][1]
    let x2, y2

    if (idx.length == 2) {
      x2 = points[idx[0]][0]
      y2 = points[idx[1]][1]
    } else {
      x2 = points[idx[2]][0]
      y2 = points[idx[2]][1]
    }

    calculateAngle(cx, cy, x1, y1, x2, y2)
  }

  points.length = 0

  return angles
}

function calculateAngle (cx, cy, x1, y1, x2, y2) {
  let v1X = x1 - cx
  let v1Y = y1 - cy
  let v2X = x2 - cx
  let v2Y = y2 - cy

  let v1 = Math.sqrt(Math.pow(v1X, 2) + Math.pow(v1Y, 2))
  let v2 = Math.sqrt(Math.pow(v2X, 2) + Math.pow(v2Y, 2))

  let angle = (Math.acos((v1X * v2X + v1Y * v2Y) / (v1 * v2)) * 180) / Math.PI

  angles.push(angle)
}

export function checkAngles (inputExercise, userAngles) {
  angles.length = 0
  
  let tempAngles = new Array()

  for (let i = 1; i < userAngles.length; i += 2) {
    tempAngles.push(userAngles[i])
  }

  let findAngle

  if (angleFlag[inputExercise]) {
    findAngle = Math.min(...tempAngles)
  } else {
    findAngle = Math.max(...tempAngles)
  }

  let angleIdx = userAngles.indexOf(findAngle)

  return [userAngles[angleIdx - 1], findAngle]
}

export function calculateAccuracy (inputExercise, userAngles) {
  let idx = 0
  let score = 0

  for (let part in scoreInfo[inputExercise]) {
    let info = scoreInfo[inputExercise][part]
    if (
      userAngles[idx] <= info[MIN_ANGLE] ||
      userAngles[idx] >= info[MAX_ANGLE]
    ) {
      score = 0
    } else {
      let diff = Math.abs(info[CORRECT_ANGLE] - userAngles[idx])
      score += PERFECT_SCORE - parseInt(diff / info[INTERVAL])
    }

    idx++
  }

  score /= idx

  let minScore = Number(window.localStorage.getItem('minScore'))
  let maxScore = Number(window.localStorage.getItem('maxScore'))
  window.localStorage.setItem('minScore', Math.min(minScore, score))
  window.localStorage.setItem('maxScore', Math.max(maxScore, score))

  score += Number(window.localStorage.getItem('totalScore'))

  window.localStorage.setItem('totalScore', score)

  userAngles.length = 0
}

export function scoreToPercent () {
  let averageAccuracy =
    (Number(window.localStorage.getItem('totalScore')) /
      Number(window.localStorage.getItem('inputReps'))) *
    10

  averageAccuracy = (Math.ceil(averageAccuracy * 100) / 100).toFixed(1)
  let minAccuracy = Number(window.localStorage.getItem('minScore')) * 10
  let maxAccuracy = Number(window.localStorage.getItem('maxScore')) * 10
  let setNum = window.localStorage.getItem('setNum')

  window.localStorage.setItem('set' + setNum, averageAccuracy)
  window.localStorage.setItem('minAccuracy', minAccuracy)
  window.localStorage.setItem('maxAccuracy', maxAccuracy)

  window.localStorage.removeItem('totalScore')
  window.localStorage.removeItem('minScore')
  window.localStorage.removeItem('maxScore')
}

const feedback = {
  squat: {
    upper: ['상체가 펴지지 않음', '상체가 과도하게 펴짐'],
    lower: ['무릎이 과도하게 굽혀짐', '무릎이 적게 굽혀짐']
  },

  lateralraise: {
    left: ['왼팔이 덜 올라감', '왼팔이 과도하게 올라감'],
    right: ['오른팔이 덜 올라감', '오른팔이 과도하게 올라감']
  },

  'legraise-left': {
    upper: ['상체가 기울어짐'],
    lower: ['다리가 덜 올라감', '다리가 과도하게 올라감']
  },

  'legraise-right': {
    upper: ['상체가 기울어짐'],
    lower: ['다리가 덜 올라감', '다리가 과도하게 올라감']
  },

  'lunge-left': {
    upper: ['상체가 기울어짐'],
    lower: ['무릎이 과도하게 굽혀짐', '무릎이 적게 굽혀짐']
  },

  'lunge-right': {
    upper: ['상체가 기울어짐'],
    lower: ['무릎이 과도하게 굽혀짐', '무릎이 적게 굽혀짐']
  }
}

export function generateFeedback () {
  let feedbackAngles = JSON.parse(window.localStorage.getItem('feedbackAngles'))
  let reps = Number(window.localStorage.getItem('inputReps'))

  feedbackAngles.forEach((angle, index) => {
    feedbackAngles[index] = Math.floor(angle / reps)
  })

  let inputExercise = window.localStorage.getItem('inputExercise')
  let feedbackList = getFeedback(inputExercise, feedbackAngles)

  // test를 위한 추가
  console.log('feedback 생성을 위해 사용된 각도: ' + feedbackAngles)
  console.log('feedback: ' + feedbackList)
  //

  window.localStorage.setItem('feedbackList', JSON.stringify(feedbackList))
}

function getFeedback (inputExercise, feedbackAngles) {
  let idx = 0
  let feedbackList = []

  for (let part in scoreInfo[inputExercise]) {
    let info = scoreInfo[inputExercise][part]
    let feedbackMessage = feedback[inputExercise][part]

    if (info[CORRECT_ANGLE] - info[INTERVAL] > feedbackAngles[idx]) {
      feedbackList.push(feedbackMessage[0])
    } else if (info[CORRECT_ANGLE] + info[INTERVAL] < feedbackAngles[idx]) {
      feedbackList.push(feedbackMessage[feedbackMessage.length - 1])
    }

    idx++
  }

  return feedbackList
}
