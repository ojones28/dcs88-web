Dcs88.count = countOld
Dcs88.countryId = country.id["CJTF_RED"]
Dcs88.spawnedGroups = {}
Dcs88.drawings = {}
Dcs88.drawingId = oldDrawingId

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

function Dcs88.deleteOldGroups(oldGroups)
    for _, name in ipairs(oldGroups) do
        local grp = Group.getByName(name)
        if grp and grp:isExist() then
            grp:destroy()
        end
    end
    oldGroups = {}
end

function Dcs88.deleteOldDrawings(oldDrawings)
    for _, id in ipairs(oldDrawings) do
        trigger.action.removeMark(id)
    end
    oldDrawings = {}
end

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

function Dcs88.spawnGroupByName(groupName, pos, heading)
    local data = Dcs88.getTemplateGroupData(groupName)
    return Dcs88.spawnGroup(data, pos, heading)
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

        Dcs88.totalFrontlineSpawns = math.floor(#Dcs88.frontlineSpawns * 0.25)
        trigger.action.outText("Spawn count: " .. #Dcs88.frontlineSpawns, 10)

        local enemyZonesTotal = 0
        for _ in pairs(Dcs88.enemyZones) do enemyZonesTotal = enemyZonesTotal + 1 end
        Dcs88.zonesActive = math.floor(enemyZonesTotal * 0.4)
    end
end