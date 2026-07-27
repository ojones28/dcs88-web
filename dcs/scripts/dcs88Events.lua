function Dcs88:onEvent(event)
    if not Dcs88.udp then
        trigger.action.outText("UDP not set", 2)
        return
    end
    if event and event.id ~= nil and event.id ~= "" then
        if Dcs88.listenEvents[event.id] ~= nil then

            local data = {
                type = "event",
                id = event.id
            }
            if event.initiator then
                data.initiator = event.initiator:getName()
                local u = Unit.getByName(data.initiator)
                data.isPlayer = false
                data.initiatorId = event.initiator:getID()
                if u and u:getPlayerName() ~= nil then
                    data.isPlayer = true
                end
                local g = u:getGroup()
                if g and g:getID() then
                    data.groupId = g:getID()
                end
            end
            if event.weapon then
                data.weapon = event.weapon:getTypeName()
            end
            if event.target then 
                data.target = event.target:getName()
            end

            if data.isPlayer then
                Dcs88.udp:sendto(Dcs88.json:encode(data), Dcs88.host, Dcs88.hookPort)
            end

        end
        if event.id == world.event.S_EVENT_MISSION_END then
            Dcs88.udp:close()
        end
    end
end