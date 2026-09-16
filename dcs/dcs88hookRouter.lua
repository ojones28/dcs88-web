local status, result = pcall(function()
    dofile([[D:\Projects\Javascript\dcs\dcs88-web\dcs\dcs88hook.lua]])
end, nil)

net.log("Loading DCS88 Hook")

if not status then
    net.log(result)
end