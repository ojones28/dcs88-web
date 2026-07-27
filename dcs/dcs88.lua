vOld = (Dcs88 and Dcs88.version) or 0
countOld = (Dcs88 and Dcs88.count) or 0
oldGroups = (Dcs88 and Dcs88.spawnedGroups) or {}
oldDrawingId = (Dcs88 and Dcs88.drawingId) or 1
oldDrawings = (Dcs88 and Dcs88.drawings) or {}
Dcs88 = {}
Dcs88.debug = hookdebug or false
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

trigger.action.outText("DCS88 Script running v".. Dcs88.version .. ", debug: " .. tostring(Dcs88.debug), 5)

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

function Dcs88.debugWrite(message)
    if Dcs88.debug then
        trigger.action.outText(message, 5)
    end
end

local basePath = "D:/Projects/Javascript/dcs/dcs88-web/dcs/scripts/"

function Dcs88.dofile(filepath)
    local ok, err = pcall(function()
        dofile(filepath)
    end)
    if not ok then
        Dcs88.debugWrite("dofile failed: " .. tostring(err))
    end
end

Dcs88.dofile(basePath .. "dcs88Core.lua")
Dcs88.dofile(basePath .. "dcs88Events.lua")
Dcs88.dofile(basePath .. "dcs88Frontline.lua")
Dcs88.dofile(basePath .. "dcs88Zones.lua")
Dcs88.dofile(basePath .. "dcs88Objectives.lua")

Dcs88.udpConnect()
world.addEventHandler(Dcs88)
Dcs88.getZones()
Dcs88.getSpawnGroups()
Dcs88.deleteOldGroups(oldGroups)
Dcs88.deleteOldDrawings(oldDrawings)

timer.scheduleFunction(Dcs88.frontlineLoop, nil, timer.getTime() + 1)
Dcs88.initZones()
Dcs88.getObjectiveSpawnTemplates()