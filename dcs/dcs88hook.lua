Dcs88h = {}
Dcs88h.debug = true
Dcs88h.enabled = true

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
            result = result .. indent .. tostring(k) .. ":\n" .. Dcs88h.tableToString(v, indent .. "  ")
        else
            result = result .. indent .. tostring(k) .. " = " .. tostring(v) .. "\n"
        end
    end
    return result
end

function Dcs88h.doScript(script)
    return net.dostring_in("server", script)
end

function Dcs88h.getJSON(host, port, path)
    local tcp = Dcs88h.socket.tcp()
    tcp:settimeout(3)
    tcp:connect(host, port)

    local req =
        "GET " .. path .. " HTTP/1.1\r\n" ..
        "Host: " .. host .. "\r\n" ..
        "Content-Type: application/json\r\n" ..
        "Connection: close\r\n\r\n"

    tcp:send(req)
    
    local response, receiveErr = tcp:receive("*a")
    
    tcp:close()

    if not response then
        return nil, receiveErr
    end
    local statusCode = tonumber(
        response:match("^HTTP/%d%.%d%s+(%d+)")
    )

    local body = response:match("\r\n\r\n(.*)")

    local data = nil

    if body and body ~= "" then
        data = Dcs88h.json:decode(body)
    end

    return {
        status = statusCode,
        ok = statusCode == 200,
        body = body,
        data = data
    }
end

function Dcs88h.postJSON(host, port, path, json)
    local tcp = Dcs88h.socket.tcp()
    tcp:settimeout(3)
    tcp:connect(host, port)

    local req =
        "POST " .. path .. " HTTP/1.1\r\n" ..
        "Host: " .. host .. "\r\n" ..
        "Content-Type: application/json\r\n" ..
        "Content-Length: " .. #json .. "\r\n" ..
        "Connection: close\r\n\r\n" ..
        json

    tcp:send(req)

    local response, receiveErr = tcp:receive("*a")
    
    tcp:close()

    if not response then
        return nil, receiveErr
    end
    local statusCode = tonumber(
        response:match("^HTTP/%d%.%d%s+(%d+)")
    )

    local body = response:match("\r\n\r\n(.*)")

    local data = nil

    if body and body ~= "" then
        data = Dcs88h.json:decode(body)
    end

    return {
        status = statusCode,
        ok = statusCode == 200,
        body = body,
        data = data
    }
end

function Dcs88h.addPlayer(playerId)
    Dcs88h.debugWrite("Add player "..playerId)
    Dcs88h.debugWrite("Sending post")
    local res = Dcs88h.postJSON(Dcs88h.webHost, Dcs88h.port, "/api/linked", Dcs88h.json:encode({ dcsId = net.get_player_info(playerId, 'ucid') }))
    Dcs88h.debugWrite("Got response")
    local linked = false
    local username = nil
    if res and res.ok then
        linked = true
        username = res.data.user.username
    end
    Dcs88h.clients[playerId] = {id = playerId, name = net.get_player_info(playerId, 'name'), ucid = net.get_player_info(playerId, 'ucid'), slot = net.get_player_info(playerId, 'slot'), ip = net.get_player_info(playerId, 'ipaddr'), linked = linked}
    if linked then
        local res2 = Dcs88h.postJSON(Dcs88h.webHost, Dcs88h.port, "/api/register-pod-session", Dcs88h.json:encode({ dcsId = net.get_player_info(playerId, 'ucid'), name = net.get_player_info(playerId, 'name') }))
        if not res2 or not res2.ok then
            if res2 and res2.data and res2.data.error then
                net.send_chat_to(res2.data.error, playerId)
            else
                net.send_chat_to("Failed to register a session", playerId)
            end
        end
        if username ~= nil then
            net.send_chat_to("Welcome back " .. string.upper(username) .. "!", playerId)
        else
            net.send_chat_to("Welcome back!", playerId)
        end
    else
        net.send_chat_to("Welcome, please link your account. Navigate to http://dcs88.xyz:8888 to register an account and generate a link command.", playerId)
    end
end

function Dcs88h.removePlayer(playerId)
    Dcs88h.postJSON(Dcs88h.webHost, Dcs88h.port, "/api/deregister-pod-session", Dcs88h.json:encode({ dcsId = net.get_player_info(playerId, 'ucid') }))
    if Dcs88h.clients[playerId] then
        Dcs88h.clients[playerId] = nil
    end
end

function Dcs88h.onMissionLoadEnd(playerId)
    Dcs88h.stop()
    DCS.reloadUserScripts()
end

function Dcs88h.onPlayerStart(playerId)
    Dcs88h.addPlayer(playerId)
end

function Dcs88h.onPlayerDisconnect(playerId)
    Dcs88h.removePlayer(playerId)
end

function Dcs88h.onPlayerTryChangeSlot(playerId, side, slotId)
    if side == 0 then
        return true
    end
    if Dcs88h.clients[playerId] then
        if not Dcs88h.clients[playerId].linked then
            net.send_chat_to("Account not linked! Navigate to http://dcs88.xyz:8888 to register an account and generate a link command.", playerId)
            return false
        else
            net.send_chat_to("Account linked, slot allowed. Have a fun flight!", playerId)
            return true
        end
    else
        net.send_chat_to("Error slotting, please reconnect to server.", playerId)
        return false
    end
end

function Dcs88h.onPlayerChangeSlot(playerId)
    if not Dcs88h.clients[playerId] then
        net.force_player_slot(playerId, 0, 0)
        net.send_chat_to("Error slotting, please reconnect to server.", playerId)
        return
    end
    if net.get_player_info(playerId, 'side') ~= 0 then
        if not Dcs88h.clients[playerId].linked then
            net.force_player_slot(playerId, 0, 0)
            net.send_chat_to("Account not linked! Navigate to http://dcs88.xyz:8888 to register an account and generate a link command.", playerId)
            return
        end
    end
    Dcs88h.clients[playerId].slot = net.get_player_info(playerId, 'slot')
    Dcs88h.debugWrite(Dcs88h.tableToString(Dcs88h.clients[playerId]))
end

function Dcs88h.onPlayerTrySendChat(playerId, message, all)
    message = string.lower(message)
    if string.sub(message, 1, 1) == "-" then
        if string.sub(message, 2) == "r" or string.sub(message, 2) == "reload" then
            net.send_chat_to("Reloading Hooks...", playerId)
            Dcs88h.stop()
            DCS.reloadUserScripts()
        else
            if not Dcs88h.clients[playerId] then
                net.send_chat_to("Error running command, please reconnect to server.", playerId)
                return ""
            end
            if string.sub(message, 2, 6) == "link " then
                local res = Dcs88h.postJSON(Dcs88h.webHost, Dcs88h.port, "/api/link", Dcs88h.json:encode({ dcsId = net.get_player_info(playerId, 'ucid'), linkCode = string.sub(message, 7) }))
                if res and res.ok then
                    net.send_chat_to("Account linked!", playerId)
                    Dcs88h.clients[playerId].linked = true
                    local res2 = Dcs88h.postJSON(Dcs88h.webHost, Dcs88h.port, "/api/register-pod-session", Dcs88h.json:encode({ dcsId = net.get_player_info(playerId, 'ucid'), name = net.get_player_info(playerId, 'name') }))
                    if not res2 or not res2.ok then
                        net.send_chat_to("Failed to register a session", playerId)
                    end
                elseif res and res.data.error then
                    net.send_chat_to("Error: " .. res.data.error, playerId)
                else
                    net.send_chat_to("Failed to link account.", playerId)
                end
            end
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
        Dcs88h.udp = nil
    end
    net.send_chat("Starting Hook")
    Dcs88h.connectUdp()
    Dcs88h.doScript([[if Dcs88 and Dcs88.killInstance then Dcs88.killInstance() end]])
    Dcs88h.doScript([[dofile("D:/Projects/Javascript/dcs/dcs88-web/dcs/dcs88.lua")]])
    Dcs88h.doScript([[
        Dcs88 = Dcs88 or {}
        Dcs88.listenEvents = ]] .. Dcs88h.serializeTable(Dcs88h.eventNames) .. [[
    ]])

    local players = net.get_player_list()
    for _, v in ipairs(players) do
        Dcs88h.addPlayer(v)
    end
    Dcs88h.debugWrite(Dcs88h.tableToString(net.get_player_list()))
end

function Dcs88h.stop()
    local players = net.get_player_list()
    for _, v in ipairs(players) do
        Dcs88h.removePlayer(v)
    end

    net.log("DCS88 Closing UDP")
    net.send_chat("Closing UDP")
    if Dcs88h.udp then
        Dcs88h.udp:close()
        Dcs88h.udp = nil
    end
end

function Dcs88h.clientFromSlot(slot)
    for _, c in ipairs(Dcs88h.clients) do
        if c.slot == slot then
            return c
        end
    end
    return nil
end

function Dcs88h.validatePlayer(unitName, client)
    local script = string.format([[
    trigger.action.outText("Unit info", 10)
    local unit = Unit.getByName(%q)
    if not unit or not unit:isExist() then return end

    if not unit:getPlayerName() then return end
    local aircraftType = unit:getTypeName()
    local ammo = unit:getAmmo() or {}
    trigger.action.outText(
        "Spawned: " .. aircraftType,
        10
    )
    local a = {}
    for i, weapon in pairs(ammo) do
        a[i] = {}
        a[i].name = weapon.desc.typeName
        a[i].count = weapon.count
    end
    return Dcs88.json:encode(a)]], unitName)
    local ammoData = Dcs88h.doScript(script)
    Dcs88h.debugWrite(ammoData)
    if ammoData then
        local ammo = Dcs88h.json:decode(ammoData)
        local res = Dcs88h.postJSON(Dcs88h.webHost, Dcs88h.port, "/api/validate", Dcs88h.json:encode({ dcsId = client.ucid, ammo = ammo }))
    end
    return false
end

function Dcs88h.onSimulationFrame()
    if Dcs88h.udp then
        local cmd, err
        repeat
            cmd, err = Dcs88h.udp:receive()
            if not err then
                -- Dcs88h.debugWrite(cmd)
                local data = Dcs88h.json:decode(cmd)
                data.idName = Dcs88h.eventNames[data.id]
                -- Dcs88h.debugWrite(Dcs88h.tableToString(data))

                if data and data.id then
                    if data.id == 15 and data.isPlayer then --birth
                        -- add f10 radio
                        if data.groupId then
                        Dcs88h.doScript(string.format([[
                            missionCommands.addCommandForGroup(%d, "Spawn Frontline", nil, Dcs88.spawnFrontline)
                            ]], data.groupId))
                        end
                        -- Dcs88h.debugWrite(Dcs88h.tableToString(data))
                        -- Dcs88h.debugWrite(Dcs88h.tableToString(Dcs88h.clients))
                        local c = Dcs88h.clientFromSlot(data.initiatorId)
                        if c then
                            Dcs88h.validatePlayer(data.initiator, c)
                        end
                    elseif data.id == 3 and data.isPlayer then
                        
                    end
                end


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
    local oldPath = package.path
    local oldCPath = package.cpath

    package.path = package.path .. ";.\\LuaSocket\\?.lua"
    package.cpath = package.cpath .. ";.\\LuaSocket\\?.dll"

    Dcs88h.socket = require("socket")

    package.path = oldPath
    package.cpath = oldCPath

    Dcs88h.json = loadfile("Scripts\\JSON.lua")()

    Dcs88h.webHost = Dcs88h.socket.dns.toip("localhost")
    Dcs88h.host = Dcs88h.socket.dns.toip("localhost")
    Dcs88h.port = 8889
    Dcs88h.udpPort = 8136
    Dcs88h.clients = {}

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
    Dcs88h.start()
end