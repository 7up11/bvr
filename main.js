import Konva from "konva"
import {newStage, newAirliner, newScope, newASM, newSAM} from "./draw"
import "./style.css"

const airlinerTerminalRadius = 8
const airlinerHitRadius = 2
const asmTerminalRadius = 15
const asmHitRadius = 2
const radioChatter = new Audio("/radio.mp3")
const contactSound = new Audio("/contact.mp3")
const launchSound = new Audio("/launch.mp3")
const hitSound = new Audio("/hit.mp3")

let paused = true
let [stage, radarLayer, guidancePathLayer, fitStage] = newStage("#radar-scope")
let airliners = []
let [scope, setAzimuth] = newScope(radarLayer)
let radarAnimation = new Konva.Animation(frame => {
    airlinersLoop(frame)
    scopeLoop(frame)
    asmLoop(frame)
    samLoop(frame)
}, radarLayer)
let lastASMTime = null
let asms = []
let guidingSAM = null
let sams = []
let score = 0

const startGame = () => {
    document.querySelector("#main-menu-title").innerText = "Paused"
    document.querySelector("#main-menu-start").setAttribute("hidden", "")
    document.querySelector("#main-menu-resume").removeAttribute("hidden")
    document.querySelector("#main-menu-restart").removeAttribute("hidden")
    stage.on("mousedown", mouseHandler)
    stage.on("mousemove", mouseHandler)
    stage.on("mouseup", mouseHandler)
    setTimeout(() => {
        commandLog("Naval Early Warning identified vampire launches, anti-ship missile attacks imminent!")
        radioChatter.play()
    }, 1000)
    setTimeout(() => commandLog("General Quarters!"), 2000)
    resumeGame()
}

const pauseGame = () => {
    if (paused)
        return
    paused = true
    document.querySelector("#main-menu").removeAttribute("hidden")
    radarAnimation.stop()
}

const resumeGame = () => {
    if (!paused)
        return
    paused = false
    document.querySelector("#main-menu").setAttribute("hidden", "")
    radarAnimation.start()
}

const restartGame = () => {
    location.reload()
}

const endGame = (message) => {
    document.querySelector("#main-menu-title").innerText = "Game Over"
    document.querySelector("#main-menu-message").innerText = `Score: ${score}\n\n${message}`
    document.querySelector("#main-menu-resume").setAttribute("hidden", "")
    pauseGame()
}

const commandLog = message => {
    const textarea = document.querySelector("#command-log-text")
    textarea.value += `\n[${new Date().toLocaleTimeString()}] ${message}`
    textarea.scrollTop = textarea.scrollHeight
}

const incScore = inc => {
    score += inc
    document.querySelector("#score").innerText = score
}

const airlinersLoop = (frame) => {
    airliners = airliners.filter(([image, inside]) => {
        if (inside())
            return true
        image.destroy()
        return false
    })

    while (airliners.length < 25) {
        airliners.push(newAirliner(radarLayer))
    }

    airliners.forEach(([, , move]) => {
        move(frame.timeDiff)
    })
}

const scopeLoop = (frame) => {
    setAzimuth(frame.time)
}

const asmLoop = (frame) => {
    const asmCoeffBase = 0.0002
    const asmCoeffTime = 0.00005
    const asmCoeff = asmCoeffBase * asmCoeffTime * Math.min(frame.time, 50e3)

    if (lastASMTime == null)
        lastASMTime = frame.time += 1000 * (3 + 10 * Math.random())

    const asmLen = Math.floor(asmCoeff * (frame.time - lastASMTime) * Math.random())
    Array(asmLen).fill().forEach(() => {
        asms.push(newASM(radarLayer))
        commandLog("Contact! Hostile anti-ship missile")
        contactSound.play()
        lastASMTime = frame.time
    })

    asms.forEach(([image, hit, move]) => {
        if (hit()) {
            image.destroy()
            commandLog("Brace for impact!")
            hitSound.play()
            endGame("Your ship is sinking after sustaining severe waterline damage. \
                     The crew have abandoned ship and are awaiting rescue.")
        }
        else {
            move(frame.timeDiff)
        }
    })
}

const samLoop = (frame) => {
    sams = sams.filter(sam => {
        sam.updateMissile(frame.timeDiff)
        if (!sam.alive())
            return false
        airliners = airliners.filter(([node]) => {
            const pos = {x: node.x(), y: node.y()}
            if (sam.hit(pos, airlinerTerminalRadius)) {
                sam.lock(node)
            }
            if (sam.hit(pos, airlinerHitRadius)) {
                sam.destroy()
                node.destroy()
                commandLog("Splash! Large commercial aircraft destroyed")
                hitSound.play()
                endGame("A civilian airliner was struck and destroyed by your surface-to-air \
                         missile. All passengers and crew are presumed lost. You have been \
                         ordered to abort your mission and return to base for debrief.")
                return false
            }
            return true
        })
        asms = asms.filter(([node]) => {
            const pos = {x: node.x(), y: node.y()}
            if (sam.hit(pos, asmTerminalRadius)) {
                sam.lock(node)
            }
            if (sam.hit(pos, asmHitRadius)) {
                sam.destroy()
                node.destroy()
                commandLog("Splash! Anti-ship missile destroyed")
                incScore(10)
                hitSound.play()
                return false
            }
            return true
        })
        return sam.alive()
    })
}

const mouseHandler = event => {
    event.evt.preventDefault()
    const pos = stage.getPointerPosition()
    const left = event.evt.buttons == 1

    // Ugly fix
    pos.x *= 1000 / stage.width()
    pos.y *= 1000 / stage.height()

    if (event.type == "mousedown") {
        if (guidingSAM) {
            guidingSAM.cancel()
            guidingSAM = null
        }
        else if (left) {
            let sam = sams.find(sam => sam.hit(pos, 15))
            if (sam) {
                sam.updateGuidancePath(pos, true)
            }
            else {
                sam = newSAM(radarLayer, guidancePathLayer)
                sam.updateGuidancePath(pos)
            }
            guidingSAM = sam
        }
    }
    else if (event.type == "mousemove" && guidingSAM) {
        guidingSAM.updateGuidancePath(pos)
    }
    else if (event.type == "mouseup" && guidingSAM) {
        if (guidingSAM.release()) {
            sams.push(guidingSAM)
            launchSound.play()
        }
        guidingSAM = null
    }
}

document.startGame = startGame
document.pauseGame = pauseGame
document.resumeGame = resumeGame
document.restartGame = restartGame
document.onkeyup = event => {
    if (event.key == "Escape")
        pauseGame()
}
document.oncontextmenu = () => false
window.onresize = fitStage
fitStage()
