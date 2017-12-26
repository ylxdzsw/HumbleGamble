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

    for i in 2563:length(kline)
        if (car(kline[i]) - car(kline[i-2562])) ÷ 60_000 == 2562 # continuous
            frame = Array{f64}(2558, 4)
            for j in 1:2558, k in 1:4
                frame[j, k] = kline[i-2563+j][k+1]
            end

            last = frame[end, 1]
            y = (cadr.(kline[i-4:i]) .- last) ./ last
            push!(data, (frame, y))
        end
    end

    return data
end

function jsonmatrix(list)
    if list[1] isa Vector
        m = Matrix{f64}(length(list[1]), length(list))
        for i in 1:length(list)
            m[:, i] = list[i]
        end
        m
    else
        reshape(Vector{f64}(list), 1, :)
    end
end

function read_conv_weight(path=rel"../../data/conv_weights.json")
    try
        data = open(readstring, path)
        data = JSON.parse(data)
        map(jsonmatrix, data)
    catch
        map(x->.8rand(x) .- .4, [(16, 4), (16, 6), (24, 8), (32, 8), (32, 8), (32, 8), (32, 8), (32, 8), (32, 8),
                                 (1, 4),  (1, 6),  (1, 8),  (1, 8),  (1, 8),  (1, 8),  (1, 8),  (1, 8),  (1, 8)])
    end
end

function save_conv_weight(w, path=rel"../../data/conv_weights.json")
    w = map(x->size(x, 1) == 1 ? x[:] : x, w)
    open(path, "w") do f
        write(f, JSON.json(w))
    end
end

@main function main()

end
