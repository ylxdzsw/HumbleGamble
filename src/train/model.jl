function im2col(x)
    p = typeof(x)(size(x, 1) ÷ 2 - 1, 5size(x, 2))

    for i in 1:size(p, 1)
        p[i, :] = x[2i-1:2i+3, :]
    end

    p
end

function im2col′(x, dy)
    dx = zeros(x)
    for i in 1:size(dy, 1)
        dx[2i-1:2i+3, :] += reshape(dy[i, :], 5, :)
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

function pred_loss(w, d, y)

end







