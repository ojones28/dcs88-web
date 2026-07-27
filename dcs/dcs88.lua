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

trigger.action.outText("DCS88 Script running v"..Dcs88.version, 5)

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

local basePath = "D:/Projects/Javascript/dcs/dcs88-web/dcs/scripts/"

dofile(basePath .. "dcs88Core.lua")
dofile(basePath .. "dcs88Events.lua")
dofile(basePath .. "dcs88Frontline.lua")
dofile(basePath .. "dcs88Zones.lua")
dofile(basePath .. "dcs88Objectives.lua")

Dcs88.udpConnect()
world.addEventHandler(Dcs88)
Dcs88.getZones()
Dcs88.getSpawnGroups()
Dcs88.deleteOldGroups(oldGroups)
Dcs88.deleteOldDrawings(oldDrawings)

timer.scheduleFunction(Dcs88.frontlineLoop, nil, timer.getTime() + 1)
Dcs88.initZones()