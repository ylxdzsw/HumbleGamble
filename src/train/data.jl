function read_data(f)
    data = Dict{Int, Tuple}()

    parse_kline(x) = data[x["time"] ÷ 60_000] = (x["close"] / 10_000, x["high"] / 10_000, x["low"] / 10_000, x["volume"] / 10_000, [])
    parse_pulse(x) = if x["time"] ÷ 60_000 in keys(data) # assume that pulse data is already sorted
        push!(data[x["time"] ÷ 60_000][end], (x["index"] / 10_000, x["last_price"] / 10_000, x["total_hold"] / 10_000, x["amount24h"] / 10_000,
                                              x["ask1"] / 10_000, x["bid1"] / 10_000, x["askd"], x["bidd"]))
    end

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

    result, last = [], 0

    for i in keys(data) |> collect |> sort
        i == last+1 ? push!(result[end], data[i]) :
                      push!(result, [data[i]])

        last = i
    end

    result
end

function encode_frame(data)
    frame = Array{f64}(2644, 4)
    for i in 1:2644
        frame[i, :] .= data[i][1:4]
    end

    ps = [collect(x) for t in data[2641:2644] for x in t[end]]

    if length(data) == 2649
        last = car(data[2644])
        y = (car.(data[2645:2649]) .- last) ./ last

        frame, ps, y
    else
        frame, ps
    end
end

function init_weights()
    const weight_spec = [
        [(.8, 32, 8), (.8, 64, 12), (.8, 96, 16), (.8, 128, 16), (0, 1, 8), (0, 1, 12), (0, 1, 16), (0, 1, 16)],
        [(.2, 16, 152), (.01, 144, 16), (0, 16)],
        [(.4, 20, 144), (0, 20)],
        [(.4, 8, 20), (0, 8), (.4, 3, 8), (0, 3)]
    ]

    map(weight_spec) do specs
        map(specs) do spec
            car(spec) * rand(cdr(spec)) .- .5car(spec)
        end
    end
end

function write_weights(w, f)
    f << "load_weights=()=>["
    for i in 1:4
        f << '['
        for x in w[i]
            f << "new Mat($(nrow(x)),$(ncol(x))," << JSON.json(x[:]) << "),"
        end
        f << ']' << (i == 4 ? ']' : ',')
    end
end
