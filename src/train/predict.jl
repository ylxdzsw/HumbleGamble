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
w: [[32 * 8], [64 * 12], [96 * 16], [128 * 16], [1 * 8], [1 * 12], [1 * 16], [1 * 16]]
"""
function kline_conv(frame, w)
    conv1 = sigm.(im2col(frame) * w[1] .+ w[5]) # 2644x4 -> 660x8
    conv2 = sigm.(im2col(conv1) * w[2] .+ w[6]) # 660x8  -> 164x12
    conv3 = sigm.(im2col(conv2) * w[3] .+ w[7]) # 164x12  -> 40x16
    conv4 = sigm.(im2col(conv3) * w[4] .+ w[8]) # 40x16   -> 9x16
    return conv4[:]
end

"""
state: [144]
w: [[20 * 144], [20]]
"""
function final(state, w)
    w[1] * state .+ w[2]
end

"""
state: [144]
pulse: [8] * n
w: [[16 * 152], [144 * 16], [16]]
"""
function pulse_recur(state, pulse, w)
    for p in pulse
        state = state .+ w[2] * sigm.(w[1] * [state; p] .+ w[3])
    end
    state
end

function pred_loss(w, frame, pulse, y)
    function entropy(p, y)
        pu, pm, pd = logp(p)
        y >  .004 ? -2pu :
        y < -.004 ? -2pd : -pm
    end

    state = kline_conv(frame, w[1])
    state = pulse_recur(state, pulse, w[2])
    p = final(state, w[3])

    entropy(p[1:3],   y[1]) + 5(p[4]  - y[1])^2 +
    entropy(p[5:7],   y[2]) + 5(p[8]  - y[2])^2 +
    entropy(p[9:11],  y[3]) + 5(p[12] - y[3])^2 +
    entropy(p[13:15], y[4]) + 5(p[16] - y[4])^2 +
    entropy(p[17:19], y[5]) + 5(p[20] - y[5])^2
end

function train_predict(w, data, nepoch=200_000, μ=[2e-5, 5e-6, 2e-6])
    g = gradloss(pred_loss)
    mean_loss = 0
    tic()

    for epoch in 1:nepoch
        d = rand(data)
        w′, loss = g(w, d...)

        skip = length(d[2]) == 0 ? 2 : 1
        for j in 1:skip:3, (x, dx) in zip(w[j], w′[j])
            x .-= μ[j] * dx
        end

        mean_loss += loss / 1000

        if epoch % 1000 == 0
            # L2 Regularization except for the last batch
            for xs in w, x in xs @when epoch != nepoch
                λ = x == w[1][1] || x == w[2][1] ? .0001 :
                                    x == w[2][2] ? .0008 : .0002
                x .-= λ * x
            end

            print("epoch: $epoch, loss: $mean_loss, ")
            toc(); tic()

            mean_loss = 0
        end
    end
    toq()
end
