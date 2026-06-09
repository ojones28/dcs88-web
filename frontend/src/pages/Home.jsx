import { useEffect, useRef, useState } from 'react'
import '../assets/styles/home.css'
import Canvas from '../components/Canvas'

const MAX_SPEED = 0.4
const MIN_SPEED = 0.35
const MAX_FORCE = 0.008

const NEIGHBOR_DIST = 200
const SEPARATION_DIST = 50
const OTHER_DIST = 100
const SIDE_DIST = 200

const ALIGNMENT_WEIGHT = 0.06
const COHESION_WEIGHT = 0.001
const SEPARATION_WEIGHT = 0.03

const TARGET_COUNT = 40
const TARGET_GROUP_SIZE = 4

const BORDER_SIZE = 0.1

const ORIGIN_OFFSET = 0.2

const DEG = Math.PI / 180
const MAX_Radar_ANGLE = 60 * DEG
const CONE_WIDTH = 30 * DEG
const HALF_CONE = CONE_WIDTH / 2

const MISSILE_SPEED = 1
const MISSILE_TURN_RATE = 0.01
const MISSILE_HIT_DIST = 12

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const clampAngle = (angle, min, max) => clamp(angle, min, max)

const createTarget = (id, group, side, width, height) => ({
    id,
    group,
    side,
    altitude: Math.random() * 30 + 5,

    x: Math.random() * width,
    y: -height * BORDER_SIZE,

    vx: (Math.random() - 0.5) * 2,
    vy: Math.random(),

    size: (width < height ? width : height) / 50,
    rotation: 0,

    alive: false,
    respawnTimer: Math.floor(Math.random() * 2000)
})

const createMissile = (target, width, height) => ({
    x: width / 2,
    y: height - (height * ORIGIN_OFFSET),

    vx: 0,
    vy: -MISSILE_SPEED,

    rotation: 0,

    targetId: target.id,
    alive: true
})

const limit = (x, y, max, min) => {
    const mag = Math.sqrt(x * x + y * y)

    if (mag > max) {
        return {
            x: (x / mag) * max,
            y: (y / mag) * max
        }
    }

    if (mag < min) {
        return {
            x: (x / mag) * min,
            y: (y / mag) * min
        }
    }

    return { x, y }
}

const rotatePoint = (x, y, angle) => ({
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle)
})

const flock = (target, targets) => {
    let alignX = 0
    let alignY = 0

    let cohesionX = 0
    let cohesionY = 0

    let cohesionZ = 0

    let separationX = 0
    let separationY = 0

    let total = 0
    let sepTotal = 0

    targets.forEach(other => {
        if (other.id == target.id || !other.alive) {
            return
        }

        const dx = other.x - target.x
        const dy = other.y - target.y

        const dist = Math.sqrt(dx * dx + dy * dy)
        if (other.side != target.side) {
            if (dist < SIDE_DIST) {
                separationX -= dx / dist
                separationY -= dy / dist
                sepTotal++
            }
        } else if (other.group != target.group) {
            if (dist < OTHER_DIST) {
                separationX -= dx / dist
                separationY -= dy / dist
                sepTotal++
            }
        } else if (dist < NEIGHBOR_DIST) {
            alignX += other.vx
            alignY += other.vy

            cohesionX += other.x
            cohesionY += other.y
            cohesionZ += other.altitude

            total++
            
            if (dist < SEPARATION_DIST) {
                separationX -= dx / dist
                separationY -= dy / dist
                sepTotal++
            }
        }
    })

    if (total > 0 || sepTotal > 0) {
        if (total > 0) {
            alignX /= total
            alignY /= total
            cohesionX = cohesionX / total - target.x
            cohesionY = cohesionY / total - target.y
            cohesionZ = cohesionZ / total - target.altitude
            alignX *= ALIGNMENT_WEIGHT
            alignY *= ALIGNMENT_WEIGHT
            cohesionX *= COHESION_WEIGHT
            cohesionY *= COHESION_WEIGHT
            cohesionZ *= COHESION_WEIGHT
        }


        separationX *= SEPARATION_WEIGHT
        separationY *= SEPARATION_WEIGHT

        const steer = limit(
            alignX + cohesionX + separationX,
            alignY + cohesionY + separationY,
            MAX_FORCE, 0
        )

        target.vx += steer.x
        target.vy += steer.y

        target.altitude += cohesionZ
    }

    const limited = limit(target.vx, target.vy, MAX_SPEED, MIN_SPEED)

    target.vx = limited.x
    target.vy = limited.y
}

const drawHostile = (ctx, enemy, inCone) => {
    ctx.save()

    ctx.translate(enemy.x, enemy.y)
    ctx.rotate(enemy.rotation)
    ctx.beginPath()
    ctx.moveTo(0, -enemy.size * 1.5)
    ctx.lineTo(0, -enemy.size * 0.7)
    ctx.lineTo(-enemy.size * 0.7, enemy.size)
    ctx.lineTo(enemy.size * 0.7, enemy.size)
    ctx.lineTo(0, -enemy.size * 0.7)
    ctx.stroke()
    if (inCone) {
        ctx.fill()
    }
    ctx.restore()
    ctx.fillText(Math.floor(enemy.altitude), enemy.x, enemy.y + 2.5 * enemy.size)
}

const drawFriendly = (ctx, friendly, inCone) => {
    ctx.save()

    ctx.translate(friendly.x, friendly.y)
    ctx.rotate(friendly.rotation)
    ctx.beginPath()
    ctx.moveTo(0, -friendly.size * 1.5)
    ctx.lineTo(0, -friendly.size * 0.7)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, friendly.size * 0.7, 0, Math.PI * 2)
    ctx.stroke()
    if (inCone) {
        ctx.fill()
    }
    ctx.restore()
    ctx.fillText(Math.floor(friendly.altitude), friendly.x, friendly.y + 2.5 * friendly.size)
}

const drawUnknown = (ctx, unknown, inCone) => {
    ctx.save()

    ctx.translate(unknown.x, unknown.y)
    ctx.rotate(unknown.rotation)
    ctx.beginPath()
    ctx.moveTo(0, -unknown.size * 1.5)
    ctx.lineTo(0, -unknown.size * 0.7)
    ctx.stroke()
    if (inCone) {
        ctx.fillRect(-unknown.size * 0.7, -unknown.size * 0.7, unknown.size * 1.35, unknown.size * 1.35)
    } else {
        ctx.strokeRect(-unknown.size * 0.7, -unknown.size * 0.7, unknown.size * 1.35, unknown.size * 1.35)
    }
    ctx.restore()
    ctx.fillText(Math.floor(unknown.altitude), unknown.x, unknown.y + 2.5 * unknown.size)
}

const drawMissile = (ctx, missile, size) => {
    ctx.save()

    ctx.translate(missile.x, missile.y)
    ctx.rotate(missile.rotation)

    ctx.beginPath()

    ctx.fillRect(-size / 2, -size * 4, size, size * 8)

    ctx.closePath()
    ctx.fill()

    ctx.restore()
}


export default function Home() {

    const targetsRef = useRef([])

    const mouseRef = useRef({ x: 0, y: 0 })

    const missilesRef = useRef([])

    const initialized = useRef(false)

    const initializeTargets = (width, height) => {
        const targets = []

        for (let i = 0; i < TARGET_COUNT * 0.50; i++) {
            targets.push(
                createTarget(i, Math.floor(i / TARGET_GROUP_SIZE), "hostile", width, height)
            )
        }

        for (let i = TARGET_COUNT * 0.50; i < TARGET_COUNT * 0.9; i++) {
            targets.push(
                createTarget(i, Math.floor(i / TARGET_GROUP_SIZE), "friendly", width, height)
            )
        }

        for (let i = TARGET_COUNT * 0.9; i < TARGET_COUNT; i++) {
            targets.push(
                createTarget(i, Math.floor(i / TARGET_GROUP_SIZE), "unknown", width, height)
            )
        }

        targetsRef.current = targets
        console.log(targets)
    }

    const updateTargets = (width, height) => {
        targetsRef.current.forEach(target => {
            if (!target.alive) {
                target.respawnTimer--

                if (target.respawnTimer <= 0) {
                    target.x = Math.random() * width
                    target.y = -height * BORDER_SIZE

                    target.vx = (Math.random() - 0.5) * 2

                    target.vy = Math.random()

                    target.altitude = Math.random() * 30 + 5

                    target.alive = true
                }

                return
            }

            flock(target, targetsRef.current)

            target.x += target.vx
            target.y += target.vy

            target.rotation = Math.atan2(target.vy, target.vx) + Math.PI / 2

            if (target.x < -width * BORDER_SIZE) target.x = width * (1 + BORDER_SIZE)
            if (target.x > width * (1 + BORDER_SIZE)) target.x = -width * BORDER_SIZE

            if (target.y < -height * BORDER_SIZE) target.y = height * (1 + BORDER_SIZE)
            if (target.y > height * (1 + BORDER_SIZE)) target.y = -height * BORDER_SIZE
        })
    }

    const updateMissiles = (width, height) => {
        missilesRef.current.forEach(missile => {
            if (!missile.alive) return

            const target = targetsRef.current.find(t => t.id === missile.targetId && t.alive)

            if (!target) {
                missile.alive = false
                return
            }

            const dx = target.x - missile.x
            const dy = target.y - missile.y

            const distance = Math.sqrt(dx * dx + dy * dy)
            const leadTime = distance / MISSILE_SPEED
            const futureX = target.x + target.vx * leadTime

            const futureY = target.y + target.vy * leadTime

            const leadDX = futureX - missile.x
            const leadDY = futureY - missile.y

            const desiredAngle = Math.atan2(leadDY, leadDX)

            const currentAngle = Math.atan2(missile.vy, missile.vx)

            let angleDiff = desiredAngle - currentAngle

            angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff))

            const turn = Math.max(-MISSILE_TURN_RATE, Math.min(MISSILE_TURN_RATE, angleDiff))

            const newAngle = currentAngle + turn

            missile.vx = Math.cos(newAngle) * MISSILE_SPEED
            missile.vy = Math.sin(newAngle) * MISSILE_SPEED

            missile.rotation = newAngle + Math.PI / 2

            missile.x += missile.vx
            missile.y += missile.vy

            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < MISSILE_HIT_DIST) {
                target.alive = false
                target.respawnTimer = 180
                missile.alive = false
            }

            if (missile.x < -100 ||
                missile.x > width + 100 ||
                missile.y < -100 ||
                missile.y > height + 100) {
                missile.alive = false
            }
        })

        missilesRef.current = missilesRef.current.filter(m => m.alive)
    }

    const drawHSD = (ctx, width, height) => {
        const minSize = width < height ? width : height

        const purple = getComputedStyle(document.body).getPropertyValue("--magenta")

        const cyan = getComputedStyle(document.body).getPropertyValue("--cyan")

        ctx.lineWidth = 2

        ctx.strokeStyle = purple

        ctx.beginPath()
        ctx.arc(
            width / 2,
            height - (height * ORIGIN_OFFSET),
            minSize / 3,
            0,
            Math.PI * 2
        )
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(
            width / 2,
            height - (height * ORIGIN_OFFSET),
            2 * minSize / 3,
            0,
            Math.PI * 2
        )
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(
            width / 2,
            height - (height * ORIGIN_OFFSET),
            minSize,
            0,
            Math.PI * 2
        )
        ctx.stroke()

        ctx.strokeStyle = cyan

        ctx.beginPath()

        ctx.moveTo(
            width / 2,
            height - (height * ORIGIN_OFFSET)
        )

        ctx.lineTo(
            width / 2,
            height - (height * ORIGIN_OFFSET) + minSize / 20
        )

        ctx.moveTo(
            width / 2 - minSize / 30,
            height - (height * ORIGIN_OFFSET)
        )

        ctx.lineTo(
            width / 2 + minSize / 30,
            height - (height * ORIGIN_OFFSET)
        )

        ctx.stroke()

        ctx.beginPath()

        ctx.moveTo(
            width / 2 - minSize / 120,
            height - (height * ORIGIN_OFFSET) + minSize / 25
        )

        ctx.lineTo(
            width / 2 + minSize / 120,
            height - (height * ORIGIN_OFFSET) + minSize / 25
        )

        ctx.stroke()
    }

    const drawRadar = (ctx, width, height) => {
        const minSize = width < height ? width : height
        const originX = width / 2
        const originY = height - (height * ORIGIN_OFFSET)
        const mouse = mouseRef.current

        const dx = mouse.x - originX
        const dy = mouse.y - originY
        const rawAngle = Math.atan2(dx, -dy)

        const clampedAngle = clampAngle(
            rawAngle,
            -MAX_Radar_ANGLE + HALF_CONE,
            MAX_Radar_ANGLE - HALF_CONE
        )

        const coneStart = clampedAngle - HALF_CONE
        const coneEnd = clampedAngle + HALF_CONE

        ctx.save()
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--cyan")

        ctx.beginPath()
        ctx.moveTo(originX, originY)
        ctx.arc(
            originX,
            originY,
            minSize,
            coneStart - Math.PI / 2,
            coneEnd - Math.PI / 2
        )
        ctx.closePath()
        ctx.stroke()

        const leftBoundary = -MAX_Radar_ANGLE
        const rightBoundary = MAX_Radar_ANGLE

        ctx.beginPath()
        ctx.moveTo(originX, originY)
        ctx.arc(
            originX,
            originY,
            minSize,
            leftBoundary - Math.PI / 2,
            rightBoundary - Math.PI / 2
        )
        ctx.lineTo(originX, originY)
        ctx.stroke()

        ctx.restore()
    }

    const isInRadarCone = (target, width, height) => {
        const originX = width / 2
        const originY = height - (height * ORIGIN_OFFSET)
        const mouse = mouseRef.current

        const dxMouse = mouse.x - originX
        const dyMouse = mouse.y - originY
        const rawAngle = Math.atan2(dxMouse, -dyMouse)

        const clampedAngle = clampAngle(
            rawAngle,
            -MAX_Radar_ANGLE + HALF_CONE,
            MAX_Radar_ANGLE - HALF_CONE
        )

        const targetDX = target.x - originX
        const targetDY = target.y - originY

        const targetAngle = Math.atan2(targetDX, -targetDY)
        const distance = Math.sqrt(targetDX * targetDX + targetDY * targetDY)

        const angleDiff = Math.atan2(
            Math.sin(targetAngle - clampedAngle),
            Math.cos(targetAngle - clampedAngle)
        )

        return distance <= Math.min(width, height) && Math.abs(angleDiff) <= HALF_CONE
    }

    const draw = (ctx, frameCount) => {
        const width = ctx.canvas.width
        const height = ctx.canvas.height
        ctx.lineWidth = 2;
        ctx.clearRect(0, 0, width, height)

        if (!initialized.current) {
            initializeTargets(width, height)
            mouseRef.current = {
                x: width / 2,
                y: 0
            }
            initialized.current = true
        }

        drawHSD(ctx, width, height)
        drawRadar(ctx, width, height)
        updateTargets(width, height)
        updateMissiles(width, height)

        const red = getComputedStyle(document.body).getPropertyValue("--red")
        const green = getComputedStyle(document.body).getPropertyValue("--green")
        const yellow = getComputedStyle(document.body).getPropertyValue("--highlight")

        ctx.font = (width < height ? width : height / 30) + "px ACES07"
        ctx.textAlign = "center"
        targetsRef.current.forEach(target => {
            if (!target.alive) return
            const inCone = isInRadarCone(target, width, height)
            if (target.side == "hostile") {
                ctx.strokeStyle = red
                ctx.fillStyle = red
                drawHostile(ctx, target, inCone)
            } else if (target.side == "friendly") {
                ctx.strokeStyle = green
                ctx.fillStyle = green
                drawFriendly(ctx, target, inCone)
            } else {
                ctx.strokeStyle = yellow
                ctx.fillStyle = yellow
                drawUnknown(ctx, target, inCone)
            }
        })

        ctx.fillStyle = yellow
        missilesRef.current.forEach(missile => {
            drawMissile(ctx, missile, (width < height ? width : height / 400))
        })
    }

     const getCanvasPoint = e => {
        const canvas = e.currentTarget

        const rect = canvas.getBoundingClientRect()

        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        }
    }

    const handleClick = e => {
        const { x, y } = getCanvasPoint(e)

        let closestTarget = null
        let closestDistance = Infinity

        targetsRef.current.forEach(target => {
            if (!target.alive) return

            if (!isInRadarCone(target, e.currentTarget.width, e.currentTarget.height)) return

            const localX = x - target.x
            const localY = y - target.y

            const hit = localX * localX + localY * localY < target.size * target.size * 3

            if (!hit) return

            const dist = Math.sqrt(
                localX * localX + localY * localY
            )

            if (dist < closestDistance) {
                closestDistance = dist
                closestTarget = target
            }
        })

        if (closestTarget) {
            missilesRef.current.push(createMissile(closestTarget, e.currentTarget.width, e.currentTarget.height))
        }
    }

    const handleMouseMove = e => {
        mouseRef.current = {
            ...getCanvasPoint(e)
        }
    }

    return (
        <div className='home'>
            <Canvas draw={draw} onClick={handleClick} onMouseMove={handleMouseMove} />
        </div>
    )
}