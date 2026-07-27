Dcs88.frontlineSpawns = {}
Dcs88.frontlineGroups = {}
Dcs88.totalFrontlineSpawns = 0

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