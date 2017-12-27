function im2col(x)
    p = typeof(x)(size(x, 1) ÷ 4 - 2, 4size(x, 2))

    for i in 1:size(p, 1)
        p[i, :] = x[2i-1:2i+2, :]
    end

    p
end

function im2col′(x, dy)
    dx = zeros(x)
    for i in 1:size(dy, 1)
        dx[2i-1:2i+2, :] += reshape(dy[i, :], 4, :)
    end
    dx
end

@primitive im2col(x),dy im2col′(x, dy)

"""
d: 2558 * 4
w: [[16 * 4], [16 * 6], [24 * 8], [32 * 8]*6, [4], [6], [8]*7]
"""
function kline_conv(d, w)
    conv1 = relu.(im2col(d)     * w[1] .+ w[10]) # 2558x4 -> 1278x4
    conv2 = relu.(im2col(conv1) * w[2] .+ w[11]) # 1278x4 -> 638x6
    conv3 = relu.(im2col(conv2) * w[3] .+ w[12]) # 638x6  -> 318x8
    conv4 = relu.(im2col(conv3) * w[4] .+ w[13]) # 318x8  -> 158x8
    conv5 = relu.(im2col(conv4) * w[5] .+ w[14]) # 158x8  -> 78x8
    conv6 = relu.(im2col(conv5) * w[6] .+ w[15]) # 78x8   -> 38x8
    conv7 = relu.(im2col(conv6) * w[7] .+ w[16]) # 38x8   -> 18x8
    conv8 = relu.(im2col(conv7) * w[8] .+ w[17]) # 18x8   -> 8x8
    conv9 = relu.(im2col(conv8) * w[9] .+ w[18]) # 8x8    -> 3x8
    return conv9[:]
end

"""
d: 24
w: [[20 * 24], [20]]
"""
function final(d, w)
    w[1] * d .+ w[2]
end

function pred_loss(w, d, y)
    function cind(y)
        y > .0018 ? 1 :
        y < -.0018 ? 3 : 2
    end

    states = kline_conv(d, w[1])
    p = final(states, w[2])
    loss = -logp(p[1:3])[cind(y[1])]   + 0.1 * (p[4]  - y[1])^2 +
           -logp(p[5:7])[cind(y[2])]   + 0.1 * (p[8]  - y[2])^2 +
           -logp(p[9:11])[cind(y[3])]  + 0.1 * (p[12] - y[3])^2 +
           -logp(p[13:15])[cind(y[4])] + 0.1 * (p[16] - y[4])^2 +
           -logp(p[17:19])[cind(y[5])] + 0.1 * (p[20] - y[5])^2
    # TODO: add regularization
end

function pred(w, d)
    states = kline_conv(d, w[1])
    p = final(states, w[2])
    map(1:5) do i
        exp.(logp(p[4i-3:4i-1])), p[4i]
    end
end

function train(w, data)
    g = grad(pred_loss)
    for i in 1:length(data)
        println(pred_loss(w, data[i]...))
        w′ = g(w, data[i]...)
        for (x, dx) in zip(w[1], w′[1])
            x .-= 0.001dx
        end
        for (x, dx) in zip(w[2], w′[2])
            x .-= 0.002dx
        end
    end
end

function assess(w, data)

end



