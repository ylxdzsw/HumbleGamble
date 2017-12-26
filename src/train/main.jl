using OhMyJulia
using AutoGrad
using Knet
using JSON
using Fire

include("model.jl")

function read_data(f)
    kline, pulse = [], []

    parse_kline(line) = push!(kline, (line["time"], line["close"], line["high"], line["low"], line["volume"]))
    parse_pulse(line) = push!(pulse, (line["time"], line["index"], line["last_price"], line["total_hold"]))

    while !eof(f)
        line = readline(f)
        if line == "=== kline ==="
            c = parse_kline
        elseif line == "=== pulse ==="
            c = parse_pulse
        else
            c(JSON.parse(line))
        end
    end

    data = []

    for i in 2881:length(kline)
        if (car(kline[i]) - car(kline[i-2880])) ÷ 60_000 == 2880 # continuous
            frame = Array{f64}(2880, 4)
            for j in 1:2880, k in 1:4
                frame[j, k] = kline[i-2881+j][k+1]
            end
            push!(data, frame)
        end
    end

    return data
end

@main function main()

end
