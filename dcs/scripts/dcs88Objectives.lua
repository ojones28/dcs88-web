Dcs88.debugWrite("Starting dcs88Objectives")

-- Dcs88.objectiveTypes = {
--     scout = { label = "Find and Destroy Scout Squad", reward = 5000 },
--     artillery = { label = "Destroy Artillery Battery", reward = 8000, maxMultiple = 2 }
-- }

Dcs88.maxActiveObjectives = 0
Dcs88.objectiveRespawnDelay = 5 * 60
Dcs88.objectives = {}
Dcs88.activeObjectives = {} -- variation, state, etc..
Dcs88.objectiveSites = {}

function Dcs88.getObjectiveSpawnTemplates()
    Dcs88.debugWrite("Generating objective spawn templates")
    for siteId, site in pairs(Dcs88.objectives) do
        for objId, obj in pairs(site) do
            for variation, zone in pairs(obj.zones) do
                for _, coalitionData in pairs(env.mission.coalition) do
                    if type(coalitionData) == "table" and coalitionData.country then
                        for _, countryData in pairs(coalitionData.country) do
                            for groupType, categoryData in pairs(countryData) do
                                if type(categoryData) == "table" and categoryData.group then
                                    for _, group in pairs(categoryData.group) do
                                        local dx = zone.x - group.x
                                        local dz = zone.z - group.y
                                        if dx * dx + dz * dz <= zone.r * zone.r then

                                            Dcs88.objectives[siteId][objId].groups[variation] = Dcs88.objectives[siteId][objId].groups[variation] or {}
                                            local g = Dcs88.split(group.name, "-")
                                            if g[1] == Dcs88.objectives[siteId][objId].prefix[variation] then
                                                table.insert(Dcs88.objectives[siteId][objId].groups[variation], group)
                                                if groupType == "static" then
                                                    local so = StaticObject.getByName(group.name)
                                                    if so and so:isExist() then
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
        end
    end

    Dcs88.debugWrite("Objective spawn templates generated")

    Dcs88.debugWrite(Dcs88.tableToString(Dcs88.objectives))
end

function Dcs88.updateSiteCircle(siteId)
    local site = Dcs88.objectiveSites[siteId]
    Dcs88.debugWrite(Dcs88.tableToString(site))

    if site.circleId ~= nil then
        Dcs88.deleteDrawing(site.circleId)
        site.circleId = nil
    end
    if site.textId ~= nil then
        Dcs88.deleteDrawing(site.textId)
        site.textId = nil
    end
    if site.activeObj > 0 then
        site.circleId = Dcs88.drawCircle(site.x, site.z, site.r, { 0, 1, 0, 1 }, { 0, 1, 0, 0.5 }, 1)
        local label = site.activeObj > 1 and site.label .. "\n" .. string.rep("-", #site.label * 1.5) or ""
        for objId, status in pairs(Dcs88.activeObjectives[siteId]) do
            if status.active then
                label = label .. (site.activeObj > 1 and "\n" or "") .. Dcs88.objectives[siteId][objId].label
            end
        end
        site.textId = Dcs88.drawText(label, site.x + site.r / 2, site.z + site.r * 1.05, { 0, 1, 0, 1 }, { 0, 0, 0, 0.5 }, 12)
    end
end

function Dcs88.initObjectives()
    local allSites = {}
    for name, _ in pairs(Dcs88.objectives) do
        table.insert(allSites, name)
    end

    Dcs88.shuffle(allSites)

    local initSite = math.ceil(Dcs88.maxActiveObjectives / 2)
    
    Dcs88.debugWrite("Activating " .. initSite .. " of " .. #allSites .. " sites. Max is " .. Dcs88.maxActiveObjectives)

    for i = 1, initSite do
        local siteId = allSites[i]
        Dcs88.debugWrite("Activating site: " .. siteId)
        Dcs88.activateSite(siteId)
    end
end

function Dcs88.activateSite(siteId)
    for objId, _ in pairs(Dcs88.objectives[siteId]) do
        Dcs88.debugWrite("Activating objective " .. objId)
        Dcs88.activateObjective(siteId, objId)
    end
    Dcs88.debugWrite("Activated site " .. siteId .. " (" .. Dcs88.objectiveSites[siteId].label .. ")")
end

function Dcs88.activateObjective(siteId, objId)
    Dcs88.activeObjectives[siteId] = Dcs88.activeObjectives[siteId] or {}
    if Dcs88.activeObjectives[siteId][objId] then
        return
    end
    Dcs88.objectiveSites[siteId].activeObj = Dcs88.objectiveSites[siteId].activeObj + 1

    local choices = {}
    for vt, _ in pairs(Dcs88.objectives[siteId][objId].zones) do
        table.insert(choices, vt)
    end
    if #choices == 0 then
        return
    end

    local variation = choices[math.random(#choices)]

    Dcs88.activeObjectives[siteId][objId] = Dcs88.activeObjectives[siteId][objId] or {
        active = true,
        variation = variation,
        deleteScheduled = false,
        deleteFunction = nil
    }

    for _, u in pairs(Dcs88.objectives[siteId][objId].groups[variation]) do
        Dcs88.spawnGroup(u)
    end

    Dcs88.debugWrite("Activated objective: " .. siteId .. " " .. objId .. " (" .. Dcs88.objectives[siteId][objId].label .. ") variation " .. variation)

    Dcs88.updateSiteCircle(siteId)
end