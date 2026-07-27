Dcs88.debugWrite("Starting dcs88Objectives")

Dcs88.objectiveTypes = {
    scout = { label = "Find and Destroy Scout Squad", reward = 5000 },
    artillery = { label = "Destroy Artillery Battery", reward = 8000 }
}

Dcs88.maxActiveObjectives = 4
Dcs88.objectiveRespawnDelay = 3 * 60
Dcs88.objectiveContribution = {}
Dcs88.objectiveSpawns = {}

Dcs88.objectiveSpawnTemplates = {}
-- groups
-- static objects
-- 

function Dcs88.getObjectiveSpawnTemplates()
    Dcs88.debugWrite("Generating objective spawn templates")
    -- type, spawns
    for t, s in pairs(Dcs88.objectiveSpawns) do
        -- zones
        for i, z in ipairs(s) do
            for _, coalitionData in pairs(env.mission.coalition) do
                if type(coalitionData) == "table" and coalitionData.country then
                    for _, countryData in pairs(coalitionData.country) do
                        for groupType, categoryData in pairs(countryData) do
                            if type(categoryData) == "table" and categoryData.group then
                                for _, group in pairs(categoryData.group) do
                                    local dx = z.x - group.x
                                    local dz = z.z - group.y
                                    if dx * dx + dz * dz <= z.r * z.r then
                                        Dcs88.objectiveSpawnTemplates[t] = Dcs88.objectiveSpawnTemplates[t] or {}
                                        Dcs88.objectiveSpawnTemplates[t][i] = Dcs88.objectiveSpawnTemplates[t][i] or {}
                                        local g = Dcs88.split(group.name)
                                        Dcs88.objectiveSpawnTemplates[t][i][g[1]] = Dcs88.objectiveSpawnTemplates[t][i][g[1]] or {}
                                        Dcs88.debugWrite("Adding group: " .. group.name)
                                        table.insert(Dcs88.objectiveSpawnTemplates[t][i][g[1]], group.name)
                                        if groupType == "static" then
                                            local so = StaticObject.getByName(group.name)
                                            if so:isExist() then
                                                so:destroy()
                                            end
                                        end
                                    end
                                end
                            end
                        end
                    end
                end
            end
        end
    end

    Dcs88.debugWrite(Dcs88.tableToString(Dcs88.objectiveSpawnTemplates))
end