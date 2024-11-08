import Konva from "konva"

const {Rect, Circle, Group, Stage, Line, Layer, Ring} = Konva

const sceneWidth = 1000
const sceneHeight = 1000
const sceneCentreX = sceneWidth / 2
const sceneCentreY = sceneHeight / 2
const sceneRadius = Math.min(sceneCentreX, sceneCentreY)
const shipHitRadius = 5

const rad2deg = rad => (
    360 / (2 * Math.PI) * rad
)

export const newStage = (container) => {
    const radarLayer = new Layer()
    const guidancePathLayer = new Layer()

    const stage = new Stage({
        container,
        width: sceneWidth,
        height: sceneHeight
    })

    const fit = () => {
        const {offsetWidth, offsetHeight} = document.querySelector(container)
        const scale = Math.min(offsetWidth, offsetHeight) / Math.max(sceneWidth, sceneHeight)
        stage.width(sceneWidth * scale);
        stage.height(sceneHeight * scale);
        stage.scale({x: scale, y: scale});
    }

    stage.add(radarLayer)
    stage.add(guidancePathLayer)

    return [stage, radarLayer, guidancePathLayer, fit]
}

export const newScope = (layer) => {
    const background = new Circle({
        x: sceneCentreX,
        y: sceneCentreY,
        radius: sceneRadius,
        fill: "#131a26"
    })
    const rangeRings = [1, 2, 3].map(r =>
        new Circle({
            x: sceneCentreX,
            y: sceneCentreX,
            radius: r * sceneRadius / 4,
            stroke: "#21385e",
            strokeWidth: 1,
            shadowForStrokeEnabled: false
        })
    )
    const tickRing = new Ring({
        x: sceneCentreX,
        y: sceneCentreY,
        innerRadius: sceneRadius * 0.95,
        outerRadius: sceneRadius,
        fill: "#21385e",
        dash: [10, 20],  // Doesn't work
        shadowForStrokeEnabled: false
    })
    const line = new Line({
        points: [sceneCentreX, sceneCentreY, sceneCentreX + sceneRadius, sceneCentreY],
        x: sceneCentreX,
        y: sceneCentreY,
        offsetX: sceneCentreX,
        offsetY: sceneCentreY,
        stroke: "#223e6b",
        strokeWidth: 3
    })
    Konva.Image.fromURL("/ship.svg", image => {
        image.x(sceneCentreX - 25)
        image.y(sceneCentreY - 25)
        image.width(50)
        image.height(50)
        group.add(image)
    })
    const group = new Group()
    group.add(background)
    group.add(...rangeRings)
    group.add(tickRing)
    group.add(line)

    layer.add(group)

    const rotate = time => {
        const angle = -time / 1000
        line.rotation(rad2deg(angle))
    }

    return [group, rotate]
}

export const newAirliner = (layer) => {
    const radius = (sceneRadius - 2 * shipHitRadius) * Math.random() + 2 * shipHitRadius
    const angle = 2 * Math.PI * Math.random()
    const bearing = Math.PI * (Math.random() < 0.5 ? 0.5 : -0.5) + angle
    const fromX = sceneRadius * Math.cos(bearing)
    const fromY = sceneRadius * Math.sin(bearing)
    const toX = radius * Math.cos(angle)
    const toY = radius * Math.sin(angle)
    const heading = Math.atan2(toY - fromY, toX - fromX)
    const speed = 0.025

    const imageElement = new Image()
    imageElement.src = "/airliner.svg"
    const image = new Konva.Image({
        image: imageElement,
        x: fromX + sceneCentreX,
        y: fromY + sceneCentreY,
        offsetX: 15,
        offsetY: 15,
        rotation: rad2deg(heading),
        width: 30,
        height: 30,
        shadowForStrokeEnabled: false
    })

    const move = elapsed => {
        const d = speed * elapsed
        image.x(d * Math.cos(heading) + image.x())
        image.y(d * Math.sin(heading) + image.y())
    }

    const inside = () => (
        0 <= image.x() && image.x() <= sceneWidth
        && 0 <= image.y() && image.y() <= sceneHeight
    )

    layer.add(image)

    return [image, inside, move]
}

export const newASM = (layer) => {
    const bearing = 2 * Math.PI * Math.random()
    const heading = bearing + Math.PI
    const speed = 0.02 + 0.02 * Math.random()

    const imageElement = new Image()
    imageElement.src = "/vampire.svg"
    const image = new Konva.Image({
        image: imageElement,
        x: sceneRadius * Math.cos(bearing) + sceneCentreX,
        y: sceneRadius * Math.sin(bearing) + sceneCentreY,
        offsetX: 15,
        offsetY: 15,
        rotation: rad2deg(heading),
        width: 30,
        height: 30,
        shadowForStrokeEnabled: false
    })

    const move = elapsed => {
        const d = speed * elapsed
        image.x(d * Math.cos(heading) + image.x())
        image.y(d * Math.sin(heading) + image.y())
    }

    const hit = () => (
        Math.abs(image.x() - sceneCentreX) < shipHitRadius
        && Math.abs(image.y() - sceneCentreY) < shipHitRadius
    )

    layer.add(image)

    return [image, hit, move]
}

export const newSAM = (samLayer, pathLayer) => {
    let speed = 0.025
    let released = false
    let lockedTarget = null
    let alive = true

    const imageElement = new Image()
    imageElement.src = "/bird.svg"
    const image = new Konva.Image({
        image: imageElement,
        x: sceneCentreX,
        y: sceneCentreY,
        offsetX: 12.5,
        offsetY: 12.5,
        rotation: rad2deg(0.5 * Math.PI),
        width: 25,
        height: 25,
        shadowForStrokeEnabled: false
    })
    const line = new Line({
        points: [sceneCentreX, sceneCentreY, sceneCentreX, sceneCentreY],
        x: sceneCentreX,
        y: sceneCentreY,
        offsetX: sceneCentreX,
        offsetY: sceneCentreY,
        stroke: "grey",
        strokeWidth: 1,
        globalCompositeOperation: "source-over",
        shadowForStrokeEnabled: false
    })

    const tail2 = ([, , ...xs]) => xs

    const midCourseHeading = () => {
        const pointsLen = line.points().length
        const currentX = line.points()[2]
        const currentY = line.points()[3]
        if (Math.abs(image.x() - currentX) < 1 && Math.abs(image.y() - currentY) < 1) {
            if (pointsLen == 4) {
                line.destroy()
                return null
            }
            line.points(tail2(line.points()))
            return midCourseHeading()
        }
        else {
            return Math.atan2(currentY - image.y(), currentX - image.x())
        }
    }

    const terminalHeading = () => {
        return Math.atan2(lockedTarget.y() - image.y(), lockedTarget.x() - image.x())
    }

    const lock = (target) => {
        if (lockedTarget)
            return false
        lockedTarget = target
        speed *= 1.5
        return true
    }

    const release = () => {
        if (released)
            return false
        samLayer.add(image)
        released = true
        return true
    }

    const destroy = () => {
        image.destroy()
        line.destroy()
        alive = false
    }

    const cancel = () => {
        if (released)
            return false
        destroy()
        return true
    }

    const updateMissile = elapsed => {
        const d = speed * elapsed
        const heading = lockedTarget ? terminalHeading() : midCourseHeading()
        if (heading == null) {
            image.destroy()
            alive = false
        }
        else {
            image.x(d * Math.cos(heading) + image.x())
            image.y(d * Math.sin(heading) + image.y())
            image.rotation(rad2deg(heading))
        }
    }

    const updateGuidancePath = (pos, replace) => {
        if (replace) {
            line.points([pos.x, pos.y, pos.x, pos.y])
        }
        else {
            line.points(line.points().concat([pos.x, pos.y]))
        }
    }

    const hit = (pos, radius) => (
        Math.abs(image.x() - pos.x) < radius
        && Math.abs(image.y() - pos.y) < radius
    )

    pathLayer.add(line)

    return {
        node: image,
        hit,
        release,
        cancel,
        destroy,
        alive: () => alive,
        lock,
        updateMissile,
        updateGuidancePath
    }
}
