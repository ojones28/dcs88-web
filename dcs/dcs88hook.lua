Dcs88h = {}
Dcs88h.debug = true
Dcs88h.enabled = true

local function addToPath(path, addition)
    if not string.find(path, addition, 1, true) then
        path = path .. ";" .. addition
    end
    return path
end

function Dcs88h.debugWrite(message)
    if Dcs88h.debug then
        local script = string.format(
            'trigger.action.outText(%q, 5)',
            tostring(message)
        )
        Dcs88h.doScript(script)
    end
end

function Dcs88h.tableToString(t, indent)
    indent = indent or ""

    local result = ""

    for k, v in pairs(t) do
        if type(v) == "table" then
            result = result ..
                indent .. tostring(k) .. ":\n" ..
                Dcs88h.tableToString(v, indent .. "  ")
        else
            result = result ..
                indent .. tostring(k) .. " = " .. tostring(v) .. "\n"
        end
    end

    return result
end

function Dcs88h.doScript(script)
    net.dostring_in("server", script)
end

function Dcs88h.getJSON(host, port, path)
    local tcp = Dcs88h.socket.tcp()
    tcp:connect(host, port)

    local req =
        "GET " .. path .. " HTTP/1.1\r\n" ..
        "Host: " .. host .. "\r\n" ..
        "Content-Type: application/json\r\n" ..
        "Connection: close\r\n\r\n"

    tcp:send(req)

    local response = tcp:receive("*a")
    local body = response:match("\r\n\r\n(.*)")
    local data = Dcs88h.json:decode(body)
    tcp:close()

    return data
end

function Dcs88h.postJSON(host, port, path, json)
    local tcp = Dcs88h.socket.tcp()
    tcp:connect(host, port)

    local req =
        "POST " .. path .. " HTTP/1.1\r\n" ..
        "Host: " .. host .. "\r\n" ..
        "Content-Type: application/json\r\n" ..
        "Content-Length: " .. #json .. "\r\n" ..
        "Connection: close\r\n\r\n" ..
        json

    tcp:send(req)

    local response = tcp:receive("*a")
    local body = response:match("\r\n\r\n(.*)")
    local data = Dcs88h.json:decode(body)
    tcp:close()

    return data
end

-- function Dcs88h.onMissionLoadBegin()
    -- Dcs88h.stop()
    -- DCS.reloadUserScripts()
-- end

function Dcs88h.onPlayerTryChangeSlot(playerId, side, slotId)
    if side == 0 then
        return
    end
    return true
end

function Dcs88h.onPlayerTrySendChat(playerId, message, all)
    message = string.lower(message)
    if string.sub(message, 1, 1) == "-" then
        if string.sub(message, 2) == "r" or string.sub(message, 2) == "reload" then
            net.send_chat_to("Reloading Hooks...", playerId)
            Dcs88h.stop()
            DCS.reloadUserScripts()
        end
        return ""
    end
end

function Dcs88h.serializeTable(t)
    local parts = {"{"}
    for k, v in pairs(t) do
        local key
        if type(k) == "number" then
            key = "[" .. k .. "]"
        else
            key = "[" .. string.format("%q", k) .. "]"
        end
        local val
        if type(v) == "string" then
            val = string.format("%q", v)
        else
            val = tostring(v)
        end
        table.insert(parts, key .. " = " .. val .. ",")
    end
    table.insert(parts, "}")
    return table.concat(parts, "\n")
end

function Dcs88h.start()
    if Dcs88h.udp then
        Dcs88h.udp:close()
    end
    net.send_chat("Starting Hook")
    Dcs88h.connectUdp()
    Dcs88h.doScript([[if Dcs88 and Dcs88.killInstance then Dcs88.killInstance() end]])
    Dcs88h.doScript([[dofile("D:/Projects/Javascript/dcs/dcs88-web/dcs/dcs88.lua")]])
    Dcs88h.doScript([[
        Dcs88 = Dcs88 or {}
        Dcs88.listenEvents = ]] .. Dcs88h.serializeTable(Dcs88h.eventNames) .. [[
    ]])
end

function Dcs88h.stop()
    net.log("DCS88 Closing UDP")
    net.send_chat("Closing UDP")
    Dcs88h.udp:close()
end

function Dcs88h.onSimulationFrame()
    if Dcs88h.udp then
        local cmd, err
        repeat
            cmd, err = Dcs88h.udp:receive()
            if not err then
                Dcs88h.debugWrite(cmd)
                local data = Dcs88h.json:decode(cmd)
                data.idName = Dcs88h.eventNames[data.id]
                Dcs88h.debugWrite(Dcs88h.tableToString(data))
            end
        until err
    end
end

function Dcs88h.onSimulationStop()
    Dcs88h.stop()
end

function Dcs88h.connectUdp()
    net.log("DCS88 Opening UDP")
    net.send_chat("Opening UDP")
    Dcs88h.udp = Dcs88h.socket.udp()
    Dcs88h.udp:setsockname(Dcs88h.host, Dcs88h.udpPort)
    Dcs88h.udp:settimeout(0)
end

if Dcs88h.enabled then
    package.path  = addToPath(package.path, ".\\LuaSocket\\?.lua")
    package.cpath = addToPath(package.cpath, ".\\LuaSocket\\?.dll")

    Dcs88h.socket = require("socket")
    Dcs88h.json = loadfile("Scripts\\JSON.lua")()

    Dcs88h.webHost = Dcs88h.socket.dns.toip("localhost")
    Dcs88h.host = Dcs88h.socket.dns.toip("localhost")
    Dcs88h.port = 8889
    Dcs88h.udpPort = 8136

    Dcs88h.eventNames = {
        [1] = "SHOT",
        [2] = "HIT",
        [3] = "TAKEOFF",
        [4] = "LAND",
        [5] = "CRASH",
        [6] = "EJECTION",
        [8] = "DEAD",
        [15] = "BIRTH",
        [28] = "KILL"
    }


    DCS.setUserCallbacks(Dcs88h)
    -- local data = Dcs88.getJSON(Dcs88.webHost, Dcs88.port, "/api/test")
    -- Dcs88.debugWrite(Dcs88.tableToString(data))
    Dcs88h.start()
end