var canvasSize = 560

const wheel = document.getElementById("wheel")
const context = wheel.getContext("2d")

const inputList = document.getElementById("input-list")
const inputAdd = document.getElementById("input-add")

const settingsButton = document.getElementById("settings-button")
const settingsMenu = document.getElementById("settings-menu")

const savesContainer = document.getElementById("saves")
const savesToggle = document.getElementById("saves-toggle")

const savesList = document.getElementById("saves-list")
const savesCurrent = document.getElementById("saves-current")

const savesCurrentName = document.getElementById("saves-current-name")
const savesUploadCurrent = document.getElementById("saves-current-upload")

const root = document.querySelector(':root')
var canUpload = false

function updateUploadAvailability() {
    canUpload = (savesCurrentName.value.length > 0 && data.length > 0)
    if (canUpload) {
        for (let key in saveSamples) {
            if (key.toLowerCase() == savesCurrentName.value.toLowerCase()) {
                canUpload = false
                break
            }
        }
    }

    savesUploadCurrent.style.filter = "brightness(var(--icon-brightness))".concat(canUpload ? "opacity(100%)" : "opacity(50%)")
}

var data = JSON.parse(localStorage.getItem("currentData") ?? '[{"name":"Option 1","weight":1,"include":true},{"name":"Option 2","weight":1,"include":true}]') ?? []
function exportCurrentData() {
    localStorage.setItem("currentData", JSON.stringify(data))
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min
}

function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max)
}

function rad2deg(rad) {
    return rad * (180 / Math.PI)
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function drawWheelSection(startAngle, endAngle, width, color) {
    let midAngle = startAngle + (endAngle - startAngle) / 2
    context.beginPath()
    context.fillStyle = color

    context.moveTo(canvasSize / 2, canvasSize / 2)
    context.arc(canvasSize / 2 + Math.cos(midAngle), canvasSize / 2 + Math.sin(midAngle), width, startAngle, endAngle)
    context.moveTo(canvasSize / 2, canvasSize / 2)
    context.fill()
}

function highlightWheelSection(startAngle, endAngle, width, color) {
    let highlightInnerWidth = 40 + width / 2 - 1

    let midAngle = startAngle + (endAngle - startAngle) / 2
    context.beginPath()
    context.strokeStyle = color
    context.lineWidth = width
    context.lineCap = "square"

    context.arc(canvasSize / 2 + Math.cos(midAngle), canvasSize / 2 + Math.sin(midAngle), highlightInnerWidth - 2, startAngle, endAngle)
    context.arc(canvasSize / 2 + Math.cos(midAngle), canvasSize / 2 + Math.sin(midAngle), canvasSize / 2 - 6, endAngle, startAngle, true)
    context.lineTo(canvasSize / 2 + Math.cos(startAngle) * highlightInnerWidth, canvasSize / 2 + Math.sin(startAngle) * highlightInnerWidth)
    context.stroke()
}

function updateWheel() {
    updateUploadAvailability()
    
    context.translate(0, 0)
    context.clearRect(0, 0, canvasSize, canvasSize)

    canvasSize = wheel.offsetHeight
    wheel.height = canvasSize
    wheel.width = canvasSize

    let currentInputs = []
    let totalWeight = 0
    data.forEach(v => {
        if (v.include) {
            currentInputs.push(v)
            totalWeight += v.weight
        }
    })

    // get appearance data
    let rs = getComputedStyle(root)
    let backgroundColor = rs.getPropertyValue('--background')
    let primaryColor = rs.getPropertyValue('--primary')

    // draw arcs of each section
    let startingAngle = 0
    for (let i = 0; i < currentInputs.length; i++) {
        let d = currentInputs[i]
        let percent = (d.weight / totalWeight) * Math.PI * 2

        d.startAngle = startingAngle
        d.endAngle = startingAngle + percent

        let hue = rad2deg(startingAngle)
        drawWheelSection(startingAngle, startingAngle + percent, canvasSize / 2 - 4, `hsl(${hue}, 100%, 80%)`)
        drawWheelSection(startingAngle, startingAngle + percent, canvasSize / 2 - 10, `hsl(${hue}, 100%, 70%)`)
        drawWheelSection(startingAngle, startingAngle + percent, 46, `hsl(${hue}, 100%, 65%)`)

        startingAngle += percent
    }

    // draw lines and titles between each section
    for (let i = 0; i < currentInputs.length; i++) {
        let d = currentInputs[i]
        if (d && d.startAngle != null) {
            // line
            context.beginPath()
            context.strokeStyle = primaryColor
            context.lineCap = "butt"
            context.lineWidth = 4
        
            context.moveTo(canvasSize / 2, canvasSize / 2)
            context.lineTo(canvasSize / 2 + Math.cos(d.startAngle) * canvasSize / 2, canvasSize / 2 + Math.sin(d.startAngle) * canvasSize / 2)
            context.stroke()

            // title
            let fontSize = Math.round(clamp((rad2deg(d.endAngle) - rad2deg(d.startAngle)), 4, 18))
            let mid = d.startAngle + (d.endAngle - d.startAngle) / 2
            context.save()
            context.translate(canvasSize / 2, canvasSize / 2)
            context.rotate(mid)

            context.font = `${fontSize}px Verdana`
            context.textAlign = "right"
            context.fillStyle = "rgb(0, 0, 0)"

            context.fillText(d.name, Math.round(canvasSize * 0.45), Math.round(fontSize / 3.5))
            context.restore()
        }
    }
    
    // draw center circle
    context.beginPath()
    context.arc(canvasSize / 2, canvasSize / 2, 40, 0, Math.PI * 2)
    context.fillStyle = primaryColor
    context.fill()

    // // draw inner circle
    context.beginPath()
    context.arc(canvasSize / 2, canvasSize / 2, 20, 0, Math.PI * 2)
    context.fillStyle = backgroundColor
    context.fill()
}

function newInput(d) {
    let alreadyExisting = (d != null)
    if (d == null) {
        d = {name: "New Input", weight: 1, include: true}
    }

    let sample = document.createElement("div")
    sample.className = "input-item"

    let inputWeight = document.createElement("input")
    inputWeight.type = "text"
    inputWeight.className = "input-item-text input-item-weight"
    inputWeight.value = d.weight ?? 1

    let inputName = document.createElement("input")
    inputName.type = "text"
    inputName.className = "input-item-text input-item-name"
    inputName.value = d.name ?? ""

    let removeButton = document.createElement("img")
    removeButton.src = "images/remove.png"
    removeButton.className = "input-item-remove prevent-select"

    let checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.className = "input-item-checkbox"
    checkbox.checked = d.include ?? true

    sample.appendChild(inputWeight)
    sample.appendChild(inputName)
    sample.appendChild(removeButton)
    sample.appendChild(checkbox)
    inputList.appendChild(sample)

    removeButton.onclick = function() {
        for (let i = 0; i < data.length; i++) {
            let v = data[i]
            if (v.instance == sample) {
                data.splice(i, 1)
            }
        }

        sample.remove()

        exportCurrentData()
        updateWheel()
    }

    inputName.onchange = function() {
        d.name = inputName.value
        exportCurrentData()
        updateWheel()
    }

    inputWeight.onchange = function() {
        d.weight = Math.max(Number(inputWeight.value) ?? 1, 0.01)
        inputWeight.value = d.weight

        exportCurrentData()
        updateWheel()
    }

    checkbox.onchange = function() {
        d.include = checkbox.checked

        exportCurrentData()
        updateWheel()
    }

    d.instance = sample
    if (!alreadyExisting) {data.push(d)}

    exportCurrentData()
}

data.forEach(newInput)
updateWheel()

inputAdd.onclick = function() {
    newInput()
    updateWheel()
}

// spin
function easeQuint(x) {
    return 1 - Math.pow(1 - x, 5)
}

var canSpin = true
wheel.onclick = function() {
    if (!canSpin || data.length < 1) {return}
    canSpin = false

    updateWheel()

    let r = deg2rad(randomBetween(0, 360))
    let spinLevel = getSettingValue("spinLevel")
    let startAngle = r + randomBetween(spinLevel * 0.85, spinLevel * 1.15)

    let timeSince = 0
    let interval = 10
    
    let spinDur = getSettingValue("spinDur")
    let spin = setInterval(() => {
        timeSince += interval

        let d = startAngle + (r - startAngle) * easeQuint(clamp(timeSince / spinDur, 0, 1))
        wheel.style.transform = `translate(-50%, -50%) rotate(${-d - Math.PI / 2}rad)`
        
        if (timeSince >= (spinDur * 0.925)) {
            for (let i = 0; i < data.length; i++) {
                let v = data[i]
                if (v.include) {
                    if (r >= v.startAngle && r < v.endAngle) {
                        highlightWheelSection(v.startAngle, v.endAngle, 6, "rgb(255, 255, 255)")
                        break
                    }
                }
            }
            
            canSpin = true
            clearInterval(spin)
        }
    }, interval)
}

// detect width
window.matchMedia("(max-width: 600px)").onchange = function(e) {
    updateWheel()
}

// settings
function getSettingValue(name) {
    let e = document.querySelector(`[data-setting=${name}]`)
    if (e != null) {
        return localStorage.getItem("setting-".concat(name)) ?? e.dataset.default
    }
    
    return 0
}

settingsButton.onclick = function() {
    let current = getComputedStyle(settingsMenu).getPropertyValue("display")
    settingsMenu.style.display = (current == "block") ? "none" : "block"
}

document.querySelectorAll('.setting').forEach(e => {
    let input = e.querySelector('input')
    if (input != null) {
        input.value = getSettingValue(e.dataset.setting) ?? e.dataset.default
        input.onchange = function() {
            if (input.type == "number") {
                input.value = Math.max(Number(input.value) ?? 1, 0)
            }

            localStorage.setItem("setting-".concat(e.dataset.setting), input.value)
        }
    }
})

// saves
updateUploadAvailability()
savesCurrentName.onchange = updateUploadAvailability

var savesExpanded = false
function updateSaveExpanded() {
    savesContainer.dataset.expanded = savesExpanded
    inputList.dataset.expanded = !savesExpanded

    savesList.style.display = savesExpanded ? "block" : "none"
    savesCurrent.style.display = savesList.style.display
}

updateSaveExpanded()
savesToggle.onclick = function() {
    savesExpanded = !savesExpanded
    updateSaveExpanded()
}

savesUploadCurrent.onclick = function() {
    if (canUpload) {
        let newSaves = getLocalSaves()
        newSaves[savesCurrentName.value] = [...data]

        localStorage.setItem("saves", JSON.stringify(newSaves))
        displaySave(savesCurrentName.value)

        updateWheel()
    }
}

var saveSamples = {}

const savesText = document.getElementById("saves-text")
function updateSavesTitle() {
    savesText.innerText = `Saved (${Object.keys(saveSamples).length})`
}

function deleteSave(saveName) {
    if (saveName in saveSamples) {
        saveSamples[saveName].remove()
        delete saveSamples[saveName]
    }

    updateUploadAvailability()
    updateSavesTitle()

    let newSaves = getLocalSaves()
    delete newSaves[saveName]

    localStorage.setItem("saves", JSON.stringify(newSaves))
}

function displaySave(saveName) {
    let sample = document.createElement("div")
    sample.className = "wheel-save"

    let nameInput = document.createElement("input")
    nameInput.className = "wheel-save-name"
    nameInput.type = "text"
    nameInput.value = saveName
    nameInput.disabled = "disabled"

    let removeButton = document.createElement("img")
    removeButton.src = "images/remove.png"
    removeButton.alt = "Delete wheel save"
    removeButton.className = "wheel-save-delete prevent-select"
    removeButton.width = 16
    removeButton.height = 16

    let importButton = document.createElement("img")
    importButton.src = "images/import.png"
    importButton.alt = "Import wheel save"
    importButton.className = "wheel-save-import prevent-select"
    importButton.width = 16
    importButton.height = 16

    removeButton.onclick = function() {
        deleteSave(saveName)
    }

    importButton.onclick = function() {
        while (inputList.firstChild) {
            inputList.firstChild.remove()
        }
        
        data = [...getLocalSaves()[saveName]]
        data.forEach(newInput)

        console.log(data)

        updateWheel()
    }

    sample.appendChild(nameInput)
    sample.appendChild(removeButton)
    sample.appendChild(importButton)
    savesList.appendChild(sample)

    saveSamples[saveName] = sample
    updateUploadAvailability()
    updateSavesTitle()
}

function getLocalSaves() {
    return JSON.parse(localStorage.getItem("saves") ?? "{}") ?? {}
}

var startingSaves = getLocalSaves()
for (let key in startingSaves) {
    displaySave(key)
}

// appearance
const appearanceToggle = document.getElementById("appearance-toggle")
const appearanceIcon = document.getElementById("appearance-icon")

var darkMode = (localStorage.getItem("darkMode") ?? "true") == "true"
function updateDarkMode() {
    appearanceIcon.src = darkMode ? "images/dark_mode_icon.png" : "images/light_mode_icon.png"

    root.style.setProperty('--background', darkMode ? 'rgb(30, 30, 30)' : 'rgb(255, 255, 255)')
    root.style.setProperty('--primary', darkMode ? 'rgb(0, 0, 0)' : 'rgb(230, 230, 230)')
    root.style.setProperty('--text', darkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)')
    root.style.setProperty('--icon-brightness', darkMode ? 1 : 0)

    updateWheel()
}

updateDarkMode()
appearanceToggle.onclick = function() {
    darkMode = !darkMode

    updateDarkMode()
    localStorage.setItem("darkMode", darkMode)
}