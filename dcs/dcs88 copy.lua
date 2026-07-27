local vOld = (Dcs88 and Dcs88.version) or 0
local countOld = (Dcs88 and Dcs88.count) or 0
local oldGroups = (Dcs88 and Dcs88.spawnedGroups) or {}
local oldDrawingId = (Dcs88 and Dcs88.drawingId) or 1
local oldDrawings = (Dcs88 and Dcs88.drawings) or {}
Dcs88 = {}
Dcs88.version = vOld + 1

local oldPath = package.path
local oldCPath = package.cpath

package.path = package.path .. ";.\\LuaSocket\\?.lua"
package.cpath = package.cpath .. ";.\\LuaSocket\\?.dll"

Dcs88.socket = require("socket")

package.path = oldPath
package.cpath = oldCPath

Dcs88.json = loadfile("Scripts\\JSON.lua")()

Dcs88.host = Dcs88.socket.dns.toip("localhost")
Dcs88.hookPort = 8136

Dcs88.listenEvents = {}

Dcs88.spawnGroups = {}
Dcs88.spawnGroupTypes = {"inf", "armor", "aaa", "build"}
Dcs88.spawnGroupSizes = {"small", "medium", "large"}
Dcs88.spawnGroupWeights = {
    inf = {base = 6, small = 1, medium = 0, large = 0},
    armor = {base = 4, small = 4, medium = 2, large = 1},
    aaa = {base = 2, small = 5, medium = 2, large = 1},
    build = {base = 3, small = 1, medium = 0, large = 0}
}
Dcs88.spawnGroupZoneWeights = {
    inf = {base = 4, small = 1, medium = 0, large = 0},
    armor = {base = 4, small = 4, medium = 4, large = 2},
    aaa = {base = 2, small = 5, medium = 3, large = 2},
    build = {base = 5, small = 1, medium = 0, large = 0}
}

Dcs88.objectiveTypes = {
    scout = { label = "Find and Destroy Scout Squad", reward = 5000 },
    artillery = { label = "Destroy Artillery Battery", reward = 8000 }
}

trigger.action.outText("DCS88 Script running v"..Dcs88.version, 5)

function Dcs88.deepCopy(obj)
  if type(obj) ~= "table" then return obj end
  local copy = {}
  for k, v in pairs(obj) do
    copy[k] = Dcs88.deepCopy(v)
  end
  return copy
end

function Dcs88.shuffle(t)
    for i = #t, 2, -1 do
        local j = math.random(i)
        t[i], t[j] = t[j], t[i]
    end
    return t
end

function Dcs88.tableToString(t, indent)
    indent = indent or ""
    local result = ""
    for k, v in pairs(t) do
        if type(v) == "table" then
            result = result .. indent .. tostring(k) .. ":\n" .. Dcs88.tableToString(v, indent .. "  ")
        else
            result = result .. indent .. tostring(k) .. " = " .. tostring(v) .. "\n"
        end
    end
    return result
end

function Dcs88.getTemplateGroupData(groupName)
    for _, coalitionData in pairs(env.mission.coalition) do
        if type(coalitionData) == "table" and coalitionData.country then
            for _, countryData in pairs(coalitionData.country) do
                for _, categoryData in pairs(countryData) do
                if type(categoryData) == "table" and categoryData.group then
                    for _, group in pairs(categoryData.group) do
                        if group.name == groupName then
                            return group
                            end
                        end
                    end
                end
            end
        end
    end
    return nil
end

Dcs88.count = countOld
Dcs88.countryId = country.id["CJTF_RED"]
function Dcs88.spawnGroupByName(groupName, pos, heading)

    local data = Dcs88.getTemplateGroupData(groupName)
    return Dcs88.spawnGroup(data, pos, heading)
end

Dcs88.spawnedGroups = {}
function Dcs88.spawnGroup(data, pos, heading)
    if not data then
        return false
    end

    local newGroup = Dcs88.deepCopy(data)
    newGroup.groupId = nil
    newGroup.name = data.name .. "_" .. Dcs88.count
    newGroup.lateActivation = nil
    
    if not newGroup.units or not newGroup.units[1] then
        return false
    end

    local parentPos = { x = newGroup.units[1].x, y = newGroup.units[1].y}

    local cosH = math.cos(heading)
    local sinH = math.sin(heading)
    for i, unit in ipairs(newGroup.units) do
        unit.unitId = nil
        local dx = unit.x - parentPos.x
        local dy = unit.y - parentPos.y
        local rx = dx * cosH - dy * sinH
        local ry = dx * sinH + dy * cosH
        unit.x = rx + pos.x
        unit.y = ry + pos.z
        unit.heading = (unit.heading + heading) % (math.pi * 2)
        unit.name = newGroup.name .. "_unit_" .. i
    end

    Dcs88.count = Dcs88.count + 1
    coalition.addGroup(data.countryId or Dcs88.countryId, Group.Category.GROUND, newGroup)
    table.insert(Dcs88.spawnedGroups, newGroup.name)
    local gName = newGroup.name
    timer.scheduleFunction(function()
        local grp = Group.getByName(gName)
        if grp and grp:isExist() then
            local controller = grp:getController()
            if controller then
                controller:setOption(8, false)
            end
        end
    end, nil, timer.getTime() + 0.1)
    return true
end

function Dcs88.killInstance()
    world.removeEventHandler(Dcs88)
    if Dcs88.udp then
        Dcs88.udp:close()
    end
    trigger.action.outText("DCS88 Script v" .. Dcs88.version .. " killed!", 5)
end

function Dcs88.udpConnect()
    Dcs88.udp = Dcs88.socket.udp()
    Dcs88.udp:settimeout(0)
end

Dcs88.drawings = {}
Dcs88.drawingId = oldDrawingId
function Dcs88.drawCircle(x, z, r, color, fillColor, lineType)
    if color == 0 or type(color) ~= "table" then
        color = { 0, 0, 0, 0 }
    end

    if fillColor == 0 or type(fillColor) ~= "table" then
        fillColor = { 0, 0, 0, 0 }
    end
    lineType = lineType or 1
    trigger.action.circleToAll(-1, Dcs88.drawingId, {x = x, y = 0, z = z}, r, color, fillColor, lineType)
    table.insert(Dcs88.drawings, Dcs88.drawingId)
    Dcs88.drawingId = Dcs88.drawingId + 1
    return Dcs88.drawingId - 1
end

function Dcs88:onEvent(event)
    if not Dcs88.udp then
        trigger.action.outText("UDP not set", 2)
        return
    end
    if event and event.id ~= nil and event.id ~= "" then
        if Dcs88.listenEvents[event.id] ~= nil then

            local data = {
                type = "event",
                id = event.id
            }
            if event.initiator then
                data.initiator = event.initiator:getName()
                local u = Unit.getByName(data.initiator)
                data.isPlayer = false
                data.initiatorId = event.initiator:getID()
                if u and u:getPlayerName() ~= nil then
                    data.isPlayer = true
                end
                local g = u:getGroup()
                if g and g:getID() then
                    data.groupId = g:getID()
                end
            end
            if event.weapon then
                data.weapon = event.weapon:getTypeName()
            end
            if event.target then 
                data.target = event.target:getName()
            end

            if data.isPlayer then
                Dcs88.udp:sendto(Dcs88.json:encode(data), Dcs88.host, Dcs88.hookPort)
            end

        end
        if event.id == world.event.S_EVENT_MISSION_END then
            Dcs88.udp:close()
        end
    end
end

Dcs88.frontlineSpawns = {}
Dcs88.enemyZones = {}
Dcs88.enemyZoneSpawns = {}
function Dcs88.getZones()
    if env.mission.triggers and env.mission.triggers.zones then
        Dcs88.frontlineSpawns = {}
        for _, z in pairs(env.mission.triggers.zones) do
            if type(z) == 'table' then
                if string.sub(z.name, 1, 5) == "spawn" then
                    table.insert(Dcs88.frontlineSpawns, { x = z.x, z = z.y })
                elseif string.sub(z.name, 1, 9) == "enemyzone" then
                    Dcs88.enemyZones[string.sub(z.name, 11)] = { x = z.x, z = z.y, r = z.radius }
                elseif string.sub(z.name, 1, 4) == "zone" then
                    local words = {}
                    for word in string.gmatch(z.name, "%S+") do table.insert(words, word) end
                    Dcs88.enemyZoneSpawns[words[2]] = Dcs88.enemyZoneSpawns[words[2]] or {}
                    table.insert(Dcs88.enemyZoneSpawns[words[2]], { x = z.x, z = z.y })
                end
            end
        end
        trigger.action.outText("Generated spawn locations", 5)
    end
end

function Dcs88.getSpawnGroups()
    for _, t in ipairs(Dcs88.spawnGroupTypes) do
        Dcs88.spawnGroups[t] = {}
        for _, s in ipairs(Dcs88.spawnGroupSizes) do
            Dcs88.spawnGroups[t][s] = {}
            for i = 1, 10 do
                local name = "spawn-"..s.."-"..t.."-"..i
                local g = Group.getByName(name)
                if g and g:isExist() then
                    table.insert(Dcs88.spawnGroups[t][s], Dcs88.getTemplateGroupData(name))
                end
            end
        end
        trigger.action.outText("Generated spawn groups for " .. t, 5)
    end
end

Dcs88.typeWeightTotal = 0
Dcs88.sizeWeightTotals = {}
for _, t in ipairs(Dcs88.spawnGroupTypes) do
    Dcs88.typeWeightTotal = Dcs88.typeWeightTotal + Dcs88.spawnGroupWeights[t].base
    Dcs88.sizeWeightTotals[t] = 0
    for _, s in ipairs(Dcs88.spawnGroupSizes) do
        Dcs88.sizeWeightTotals[t] = Dcs88.sizeWeightTotals[t] + Dcs88.spawnGroupWeights[t][s]
    end
end

trigger.action.outText(Dcs88.tableToString(Dcs88.sizeWeightTotals), 5)

function Dcs88.weightedSpawnGroup(weights)
    local typeRandom = math.random(Dcs88.typeWeightTotal)
    local cumulative = 0
    local typeSpawn = nil
    for _, t in ipairs(Dcs88.spawnGroupTypes) do
        cumulative = cumulative + weights[t].base
        if typeRandom <= cumulative then
            typeSpawn = t
            break
        end
    end
    if not typeSpawn then return nil end

    local sizeRandom = math.random(Dcs88.sizeWeightTotals[typeSpawn])
    cumulative = 0
    for _, s in ipairs(Dcs88.spawnGroupSizes) do
        cumulative = cumulative + weights[typeSpawn][s]
        if sizeRandom <= cumulative then
            local g = Dcs88.spawnGroups[typeSpawn][s]
            if #g > 0 then return g[math.random(#g)] end
        end
    end
    return nil
end

function Dcs88.deleteOldDrawings(oldDrawings)
    for _, id in ipairs(oldDrawings) do
        trigger.action.removeMark(id)
    end
    oldDrawings = {}
end

Dcs88.frontlineGroups = {}
Dcs88.totalFrontlineSpawns = 0

function Dcs88.deleteOldGroups(oldGroups)
    for _, name in ipairs(oldGroups) do
        local grp = Group.getByName(name)
        if grp and grp:isExist() then
            grp:destroy()
        end
    end
    oldGroups = {}
end

function Dcs88.countAliveFrontline()
    local alive = 0
    local aliveEntries = {}
    for _, entry in ipairs(Dcs88.frontlineGroups) do
        local grp = Group.getByName(entry.name)
        if grp and grp:isExist() and grp:getSize() > 0 then
            alive = alive + 1
            table.insert(aliveEntries, entry)
        end
    end
    Dcs88.frontlineGroups = aliveEntries
    return alive
end

function Dcs88.isTooClose(pos, occupiedList, minDist)
    for _, o in ipairs(occupiedList) do
        local dx = pos.x - o.x
        local dz = pos.z - o.z
        if dx*dx + dz*dz < minDist * minDist then
            return true
        end
    end
    return false
end

Dcs88.zoneStates = {}
-- active
-- circleId
-- groups
-- initialCount
-- totalGroups
-- status
-- deleteTimer
-- deleteScheduled

function Dcs88.activateZone(name)
    local zone = Dcs88.enemyZones[name]
    local spawns = Dcs88.enemyZoneSpawns[name]
    local shuffledSpawns = {}
    for _, v in ipairs(spawns) do table.insert(shuffledSpawns, v) end
    Dcs88.shuffle(shuffledSpawns)

    local count = math.max(1, math.floor(#shuffledSpawns * Dcs88.zoneSpawnAmount))
    local state = {
        active = true,
        circleId = false,
        groups = {},
        initialCount = 0,
        totalGroups = 0,
        status = "healthy",
        deleteScheduled = false
    }
    Dcs88.zoneStates[name] = state

    for i = 1, count do
        local l = Dcs88.weightedSpawnGroup(Dcs88.spawnGroupZoneWeights)
        if l then
            local pos = shuffledSpawns[i]
            if Dcs88.spawnGroup(l, pos, math.rad(math.random(0, 359))) then
                local gName = Dcs88.spawnedGroups[#Dcs88.spawnedGroups]
                table.insert(state.groups, { name = gName, spawn = pos })
            end
        end
    end

    timer.scheduleFunction(function()
        local total = 0
        for _, entry in ipairs(state.groups) do
            local grp = Group.getByName(entry.name)
            if grp and grp:isExist() then
                total = total + grp:getSize()
            end
        end
        state.initialCount = math.max(1, total)
    end, nil, timer.getTime() + 0.5)

    Dcs88.setZoneCircleColor(name, {1, 0, 0})

    timer.scheduleFunction(Dcs88.zoneHealthLoop, name, timer.getTime() + 0.5)

    trigger.action.outText("Zone " .. name .. " activated with " .. count .. " groups.", 8)
    return true
end

function Dcs88.setZoneCircleColor(name, color)
    local state = Dcs88.zoneStates[name]
    local zone  = Dcs88.enemyZones[name]
    if not state or not zone then return end

    if state.circleId then
        trigger.action.removeMark(state.circleId)
        for i = #Dcs88.drawings, 1, -1 do
            if Dcs88.drawings[i] == state.circleId then
                table.remove(Dcs88.drawings, i)
                break
            end
        end
    end
    table.insert(color, 1)
    local fillColor = { color[1], color[2], color[3], 0.5 }

    state.circleId = Dcs88.drawCircle(zone.x, zone.z, zone.r, color, fillColor, 1)
end

function Dcs88.countZoneUnits(zoneName)
    local state = Dcs88.zoneStates[zoneName]
    if not state then return 0 end
    local alive = 0
    local aliveGroups = {}
    for _, entry in ipairs(state.groups) do
        local grp = Group.getByName(entry.name)
        if grp and grp:isExist() and grp:getSize() > 0 then
            alive = alive + grp:getSize()
            table.insert(aliveGroups, entry)
        end
    end
    state.groups = aliveGroups
    return alive
end

function Dcs88.zoneHealthLoop(zoneName)
    if Dcs88.version ~= vOld + 1 then return nil end

    local state = Dcs88.zoneStates[zoneName]
    if not state or not state.active then return nil end

    local alive = Dcs88.countZoneUnits(zoneName)
    local initial = state.initialCount
    if initial == 0 then
        return timer.getTime() + 5
    end

    local ratio = alive / initial
    -- trigger.action.outText("Zone " .. zoneName .. " at " .. ratio, 15)

    if ratio <= Dcs88.zoneDead then
        if state.status ~= "critical" then
            state.status = "critical"
            Dcs88.setZoneCircleColor(zoneName, {0.5, 0, 0.7})
            trigger.action.outText("Zone " .. zoneName .. " critical deleting in 5 minutes", 10)
        end
        if not state.deleteScheduled then
            state.deleteScheduled = true
            timer.scheduleFunction(function()
                if Dcs88.version ~= vOld + 1 then return nil end
                local s = Dcs88.zoneStates[zoneName]
                if s and s.active and s.deleteScheduled then
                    Dcs88.destroyZone(zoneName)
                end
                return nil
            end, nil, timer.getTime() + Dcs88.zoneDeleteDelay)
        end
    elseif ratio <= Dcs88.zoneWaring then
        if state.status == "healthy" then
            state.status = "warning"
            Dcs88.setZoneCircleColor(zoneName, {1, 0.5, 0})
            trigger.action.outText("Zone " .. zoneName .. " at 50%", 8)
        end
    end

    if alive == 0 and not state.deleteScheduled then
        Dcs88.destroyZone(zoneName)
        return nil
    end

    return timer.getTime() + 15
end

function Dcs88.destroyZone(zoneName)
    local state = Dcs88.zoneStates[zoneName]
    if not state then return end

    for _, entry in ipairs(state.groups) do
        local grp = Group.getByName(entry.name)
        if grp and grp:isExist() then
            grp:destroy()
        end
    end
    state.groups = {}
    state.active = false
    state.deleteScheduled = false
    state.status = "dead"
    if state.circleId then
        trigger.action.removeMark(state.circleId)
        for i = #Dcs88.drawings, 1, -1 do
            if Dcs88.drawings[i] == state.circleId then
                table.remove(Dcs88.drawings, i)
                break
            end
        end
        state.circleId = nil
    end

    trigger.action.outText("Zone " .. zoneName .. " destroyed", 8)

    timer.scheduleFunction(function()
        if Dcs88.version ~= vOld + 1 then return nil end
        Dcs88.respawnZones()
        return nil
    end, nil, timer.getTime() + Dcs88.zoneRespawnDelay)
end

function Dcs88.respawnZones()
    local allZoneNames = {}
    for name, _ in pairs(Dcs88.enemyZones) do
        table.insert(allZoneNames, name)
    end

    local target = Dcs88.zonesActive

    local activeCount = 0
    for _, name in ipairs(allZoneNames) do
        local s = Dcs88.zoneStates[name]
        if s and s.active then activeCount = activeCount + 1 end
    end

    local needed = target - activeCount
    if needed <= 0 then return end

    local inactive = {}
    for _, name in ipairs(allZoneNames) do
        local s = Dcs88.zoneStates[name]
        if not s or not s.active then
            table.insert(inactive, name)
        end
    end

    Dcs88.shuffle(inactive)

    for i = 1, math.min(needed, #inactive) do
        Dcs88.activateZone(inactive[i])
    end
end

function Dcs88.initZones()
    local allZoneNames = {}
    for name, _ in pairs(Dcs88.enemyZones) do
        table.insert(allZoneNames, name)
    end

    Dcs88.shuffle(allZoneNames)
    
    trigger.action.outText("Activating " .. Dcs88.zonesActive .. " of " .. #allZoneNames .. " zones.", 8)

    for i = 1, Dcs88.zonesActive do
        local name = allZoneNames[i]
        Dcs88.activateZone(name)
    end
end

function Dcs88.frontlineLoop()
    if Dcs88.version ~= vOld + 1 then
        return nil
    end
    local alive = 0
    local aliveEntries = {}
    local occupiedSpawns = {}

    for _, entry in ipairs(Dcs88.frontlineGroups) do
        local grp = Group.getByName(entry.name)
        if grp and grp:isExist() and grp:getSize() > 0 then
            alive = alive + 1
            table.insert(aliveEntries, entry)
            table.insert(occupiedSpawns, entry.spawn)
        end
    end
    Dcs88.frontlineGroups = aliveEntries

    local needed = Dcs88.totalFrontlineSpawns - alive
    if needed > 0 then
        local availableSpawns = {}
        for _, v in ipairs(Dcs88.frontlineSpawns) do
            if not Dcs88.isTooClose(v, occupiedSpawns, 500) then
                table.insert(availableSpawns, v)
            end
        end

        Dcs88.shuffle(availableSpawns)

        for i = 1, math.min(needed, #availableSpawns) do
            local l = Dcs88.weightedSpawnGroup(Dcs88.spawnGroupWeights)
            if l then
                if Dcs88.spawnGroup(l, availableSpawns[i], math.rad(math.random(0, 359))) then
                    -- trigger.action.outText("Respawn group", 5)
                    table.insert(Dcs88.frontlineGroups, { name = Dcs88.spawnedGroups[#Dcs88.spawnedGroups], spawn = availableSpawns[i] })
                end
            end
        end
    end

    return timer.getTime() + 60
end

Dcs88.udpConnect()
world.addEventHandler(Dcs88)
Dcs88.getZones()
Dcs88.totalFrontlineSpawns = math.floor(#Dcs88.frontlineSpawns * 0.25)
local enemyZonesTotal = 0
for _ in pairs(Dcs88.enemyZones) do enemyZonesTotal = enemyZonesTotal + 1 end
Dcs88.zonesActive = math.floor(enemyZonesTotal * 0.4)
Dcs88.zoneSpawnAmount = 0.3
Dcs88.zoneWaring = 0.5
Dcs88.zoneDead = 0.1
Dcs88.zoneDeleteDelay = 5 * 60
Dcs88.zoneRespawnDelay = 2 * 60
trigger.action.outText("Spawn count: " .. #Dcs88.frontlineSpawns, 10)
Dcs88.maxActiveObjectives = 4
Dcs88.objectiveRespawnDelay = 3 * 60
Dcs88.getSpawnGroups()
Dcs88.deleteOldGroups(oldGroups)
Dcs88.deleteOldDrawings(oldDrawings)
timer.scheduleFunction(Dcs88.frontlineLoop, nil, timer.getTime() + 1)
Dcs88.initZones()