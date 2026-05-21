local v = (Dcs88 and Dcs88.version) or 0
Dcs88 = {}
Dcs88.version = v + 1

local function addToPath(path, addition)
    if not string.find(path, addition, 1, true) then
        path = path .. ";" .. addition
        trigger.action.outText("Adding path", 2)
    end
    return path
end

package.path  = addToPath(package.path, ".\\LuaSocket\\?.lua")
package.cpath = addToPath(package.cpath, ".\\LuaSocket\\?.dll")

-- package.path = package.path..";.\\LuaSocket\\?.lua"
-- package.cpath = package.cpath..";.\\LuaSocket\\?.dll"
Dcs88.socket = require("socket")
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

function Dcs88:onEvent(event)
    if not Dcs88.udp then
        trigger.action.outText("UDP not set", 2)
        return
    end
    if event and event.id ~= nil and event.id ~= "" then
        if Dcs88.listenEvents[event.id] ~= nil then
            trigger.action.outText("Event " .. tostring(event.id), 2)
    
            local data = {
                type = "event",
                id = event.id
            }
            if event.initiator then
                data.initiator = event.initiator:getName()
            end
            if event.weapon then
                data.weapon = event.weapon:getTypeName()
            end
            if event.target then 
                data.target = event.target:getName()
            end
    
            Dcs88.udp:sendto(Dcs88.json:encode(data), Dcs88.host, Dcs88.hookPort)
        end
        if event.id == world.event.S_EVENT_MISSION_END then
            Dcs88.udp:close()
        end
    end
end

Dcs88.udpConnect()
world.addEventHandler(Dcs88)