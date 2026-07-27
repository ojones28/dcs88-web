Dcs88.debugWrite("Starting dcs88Zones")

Dcs88.zoneStates = {}
-- active
-- circleId
-- groups
-- initialCount
-- totalGroups
-- status
-- deleteTimer
-- deleteScheduled

Dcs88.enemyZones = {}
Dcs88.enemyZoneSpawns = {}

Dcs88.zonesActive = 0
Dcs88.zoneSpawnAmount = 0.3
Dcs88.zoneWaring = 0.5
Dcs88.zoneDead = 0.1
Dcs88.zoneDeleteDelay = 5 * 60
Dcs88.zoneRespawnDelay = 2 * 60

function Dcs88.initZones()
    local allZoneNames = {}
    for name, _ in pairs(Dcs88.enemyZones) do
        table.insert(allZoneNames, name)
    end

    Dcs88.shuffle(allZoneNames)
    
    Dcs88.debugWrite("Activating " .. Dcs88.zonesActive .. " of " .. #allZoneNames .. " zones.")

    for i = 1, Dcs88.zonesActive do
        local name = allZoneNames[i]
        Dcs88.activateZone(name)
    end
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

    Dcs88.debugWrite("Zone " .. zoneName .. " destroyed")

    timer.scheduleFunction(function()
        if Dcs88.version ~= vOld + 1 then return nil end
        Dcs88.respawnZones()
        return nil
    end, nil, timer.getTime() + Dcs88.zoneRespawnDelay)
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
            Dcs88.debugWrite("Zone " .. zoneName .. " critical deleting in 5 minutes")
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
            Dcs88.debugWrite("Zone " .. zoneName .. " at 50%")
        end
    end

    if alive == 0 and not state.deleteScheduled then
        Dcs88.destroyZone(zoneName)
        return nil
    end

    return timer.getTime() + 15
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

    Dcs88.debugWrite("Zone " .. name .. " activated with " .. count .. " groups")
    return true
end