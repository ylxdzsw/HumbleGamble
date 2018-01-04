using OhMyJulia
using AutoGrad
using Knet
using JSON
using Fire
using JLD2
using StatsBase

include("data.jl")
include("predict.jl")
include("policy.jl")

@main function predict(epoch::Int=50000)
    data = open(read_data, rel"../../data/data.json")

    @load rel"../../data/weights.jld" w

    @time frames = [encode_frame(ds[i-2648:i]) for ds in data for i in 2649:length(ds)]
    train_predict(w, frames, epoch)

    @save rel"../../data/weights.jld" w

    open(rel"../model/weights.js", "w") do f
        write_weights(w, f)
    end
end

pred(x, w) = begin
    frame, pulse = x
    state = kline_conv(frame, w[1])
    state = pulse_recur(state, pulse, w[2])
    final(state, w[3]), frame[end, 1]
end

@main function policy(epoch::Int=20000)
    data = open(read_data, rel"../../data/data.json")

    @load rel"../../data/weights.jld" w

    @time frames = [[pred(encode_frame(ds[i-2643:i]), w) for i in 2644:length(ds)] for ds in data if length(ds) >= 2673]

    train_policy(w[4], frames, epoch)

    @save rel"../../data/weights.jld" w

    open(rel"../model/weights.js", "w") do f
        write_weights(w, f)
    end
end
