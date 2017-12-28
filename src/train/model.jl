function im2col(x)
    p = typeof(x)(size(x, 1) ÷ 4 - 1, 8size(x, 2))

    for i in 1:size(p, 1)
        p[i, :] = x[4i-3:4i+4, :]
    end

    p
end

function im2col′(x, dy)
    dx = zeros(x)
    for i in 1:size(dy, 1)
        dx[4i-3:4i+4, :] += reshape(dy[i, :], 8, :)
    end
    dx
end

@primitive im2col(x),dy im2col′(x, dy)

"""
frame: [2644 * 4]
w: [[32 * 4], [32 * 6], [48 * 8], [64 * 8], [1 * 4], [1 * 6], [1 * 8], [1 * 8]]
"""
function kline_conv(frame, w)
    conv1 = sigm.(im2col(frame) * w[1] .+ w[5]) # 2644x4 -> 660x4
    conv2 = sigm.(im2col(conv1) * w[2] .+ w[6]) # 660x4  -> 164x6
    conv3 = sigm.(im2col(conv2) * w[3] .+ w[7]) # 164x6  -> 40x8
    conv4 = sigm.(im2col(conv3) * w[4] .+ w[8]) # 40x8   -> 9x8
    return conv4[:]
end

"""
state: [72]
w: [[20 * 72], [20]]
"""
function final(state, w)
    w[1] * state .+ w[2]
end

"""
state: [72]
pulse: [8] * n
w: [[8 * 80], [72 * 8], [8]]
"""
function pulse_recur(state, pulse, w)
    for p in pulse
        state = state .+ w[2] * sigm.(w[1] * [state; p] .+ w[3])
    end
    state
end

function pred_loss(w, frame, pulse, y)
    function cind(y)
        y >  .01 ? 1 :
        y < -.01 ? 3 : 2
    end

    state = kline_conv(frame, w[1])
    state = pulse_recur(state, pulse, w[2])
    p = final(state, w[3])

    loss = -logp(p[1:3])[cind(y[1])]   + 0.1 * (p[4]  - y[1])^2 +
           -logp(p[5:7])[cind(y[2])]   + 0.1 * (p[8]  - y[2])^2 +
           -logp(p[9:11])[cind(y[3])]  + 0.1 * (p[12] - y[3])^2 +
           -logp(p[13:15])[cind(y[4])] + 0.1 * (p[16] - y[4])^2 +
           -logp(p[17:19])[cind(y[5])] + 0.1 * (p[20] - y[5])^2
    # TODO: add regularization
end

function train(w, data, nepoch=200, μ=[0.01, 0.01, 0.005])
    g = gradloss(pred_loss)
    tic()
    for epoch in 1:nepoch
        total_loss = 0
        for i in 1:length(data)
            w′, loss = g(w, data[i]...)
            skip = length(data[i][2]) == 0 ? 2 : 1
            for j in 1:skip:3, (x, dx) in zip(w[j], w′[j])
                x .-= μ[j] * dx
            end
            total_loss += loss
        end
        print("epoch: $epoch, loss: $total_loss, ")
        toc(); tic()
    end
    toq()
end
