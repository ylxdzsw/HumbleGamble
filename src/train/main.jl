using OhMyJulia
using AutoGrad
using Knet
using JSON
using Fire
using JLD

include("model.jl")

function read_data(f)
    kline, pulse = [], []

    parse_kline(line) = push!(kline, (line["time"], line["close"] / 10_000, line["high"] / 10_000, line["low"] / 10_000, line["volume"] / 10_000))
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
            ps = filter(x->car(kline[i-8]) <= car(x) < car(kline[i-3]), pulse) # up to 5min
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

function init_weights()
    const weight_spec = [
        [(.8, 32, 8), (.8, 64, 12), (.8, 96, 16), (.8, 128, 16), (0, 1, 8), (0, 1, 12), (0, 1, 16), (0, 1, 16)],
        [(.2, 16, 152), (.01, 144, 16), (0, 16)],
        [(.4, 20, 144), (0, 20)]
    ]

    map(weight_spec) do specs
        map(specs) do spec
            car(spec) * rand(cdr(spec)) .- .5car(spec)
        end
    end
end

function write_weights(w, f)
    list = []
    for x in w, m in x
        append!(list, m[:])
    end

    write(f, JSON.json(list))
end

@main function main(epoch::Int=200)
    data = open(read_data, rel"../../data/data.json")
    w = try
        load(rel"../../data/weights.jld")["w"]
    catch
        println("fail to find weights, init new weights...")
        init_weights()
    end

    train(w, data, 1000 * epoch)

    save(rel"../../data/weights.jld", "w", w)

    open(rel"../model/weights.js", "w") do f
        f << "load_weights=()=>["
        for i in 1:3
            f << '['
            for x in w[i]
                f << "new Mat($(nrow(x)),$(ncol(x))," << JSON.json(x[:]) << "),"
            end
            f << ']' << (i == 3 ? ']' : ',')
        end
    end
end
