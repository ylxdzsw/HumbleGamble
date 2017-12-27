using OhMyJulia
using AutoGrad
using Knet
using JSON
using Fire

include("model.jl")

function read_data(f)
    kline, pulse = [], []

    parse_kline(line) = push!(kline, (line["time"], line["close"] / 10_000, line["high"] / 10_000, line["low"] / 10_000, line["volume"] / 1000))
    parse_pulse(line) = push!(pulse, (line["time"], line["index"] / 10_000, line["last_price"] / 10_000, line["total_hold"] / 10_000, line["amount24h"] / 10_000,
                                                    line["ask1"] / 10_000, line["bid1"] / 10_000, line["askd"], line["bidd"]))

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

    for i in 2649:length(kline)
        if (car(kline[i]) - car(kline[i-2648])) ÷ 60_000 == 2648 # continuous
            ps = filter(x->car(kline[i-4]) <= car(x) < car(kline[i-3]), pulse)
            ps = map(collect ∘ cdr, ps)

            frame = Array{f64}(2644, 4)
            for j in 1:2644, k in 1:4
                frame[j, k] = kline[i-2649+j][k+1]
            end

            last = frame[end, 1]
            y = (cadr.(kline[i-4:i]) .- last) ./ last
            push!(data, (frame, ps, y))
        end
    end

    return data
end

const spec = [
    [(.5, 32, 4), (.5, 32, 6), (.5, 48, 8), (.5, 64, 8), (0, 1, 4), (0, 1, 6), (0, 1, 8), (0, 1, 8)],
    [(.2, 8, 80), (.2, 72, 8)],
    [(.5, 20, 72), (0, 1, 20)]
]

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

function read_weights(name, spec)
    try
        data = open(readstring, rel"../../data/" * name) |> JSON.parse
        map(jsonmatrix, data)
    catch
        map(x->car(x) * rand(cdr(x)) .- .5car(x), spec)
    end
end

function save_weights(w, name)
    w = map(x->size(x, 1) == 1 ? x[:] : x, w)
    open(rel"../../data/" * name, "w") do f
        write(f, JSON.json(w))
    end
end

function read_conv_weights()
    read_weights("conv_weights.json", )
end

save_conv_weights(w) = save_weights(w, "conv_weights.json")

function read_recur_weights()
    read_weights("recur_weights.json", )
end

save_recur_weights(w) = save_weights(w, "recur_weights.json")

function read_final_weights()
    read_weights("final_weights.json", )
end

save_final_weights(w) = save_weights(w, "final_weights.json")

@main function main(x::Int=200)
    w = [read_conv_weights(), read_recur_weights(), read_final_weights()]
    data = open(read_data, rel"../../data/data.json")
    train(w, data, x)
    save_conv_weights(w[1])
    save_recur_weights(w[2])
    save_final_weights(w[3])
end
