function im2col(x)
    p = typeof(x)((size(x, 1) - 3) ÷ 2, 5size(x, 2))

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
d: 2880 * 4
w: [[20 * 4], [20 * 6], [30 * 8], [40 * 8]*5, [4], [6], [8]*5, [64 * 20], [20]]
"""
function kline_conv(d, w)
    conv1 = max(im2col(d)     * w[1] .+ w[9], 0)  # 2880x4 -> 1438x4
    conv2 = max(im2col(conv1) * w[2] .+ w[10], 0) # 1438x4 -> 717x6
    conv3 = max(im2col(conv2) * w[3] .+ w[11], 0) # 717x6  -> 357x8
    conv4 = max(im2col(conv3) * w[4] .+ w[12], 0) # 357x8  -> 177x8
    conv5 = max(im2col(conv4) * w[5] .+ w[13], 0) # 177x8  -> 87x8
    conv6 = max(im2col(conv5) * w[6] .+ w[14], 0) # 87x8   -> 42x8
    conv7 = max(im2col(conv6) * w[7] .+ w[15], 0) # 42x8   -> 19x8
    conv8 = max(im2col(conv7) * w[8] .+ w[16], 0) # 19x8   -> 8x8
    return sigm.(w[17]' * conv8[:] .+ w[18])
end

function read_conv_weight(path="")
    try
        data = open(read, path)
        data = JSON.parse(data)
        error("TODO: list -> matrix")
    catch
        map(x->.8rand(x) .- .4, [(20, 4), (20, 6), (30, 8), (40, 8), (40, 8), (40, 8), (40, 8), (40, 8),
                                 (1, 4), (1, 6), (1, 8), (1, 8), (1, 8), (1, 8), (1, 8), (1, 8), (64, 20), 20])
    end
end

