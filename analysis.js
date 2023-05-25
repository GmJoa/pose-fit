window.onload = function () {
  let setNum = Number(window.localStorage.getItem('setNum')) - 1

  let avgAccuracy = Number(window.localStorage.getItem('set' + setNum))
  let minAccuracy = Number(window.localStorage.getItem('minAccuracy'))
  let maxAccuracy = Number(window.localStorage.getItem('maxAccuracy'))

  fillProgressBar(avgAccuracy, '.avg-bar', '.avg-value', '평균')
  fillProgressBar(minAccuracy, '.min-bar', '.min-value', '최소')
  fillProgressBar(maxAccuracy, '.max-bar', '.max-value', '최대')
}

function fillProgressBar (accuracy, barName, valueName, typeName) {
  let bar = document.querySelector(barName)
  let value = document.querySelector(valueName)

  console.log(barName)

  let radius = 54
  let circumference = 2 * Math.PI * radius

  let dashOffset = circumference * (1 - accuracy / 100)

  value.innerHTML = typeName + '\n' + accuracy + '%'

  bar.style.strokeDashoffset = dashOffset
  bar.style.strokeDasharray = circumference
}