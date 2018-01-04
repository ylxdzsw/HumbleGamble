"""
pred: [20]
w: [[8 * 20], [8], [5 * 8], [5]]
"""
function decide(pred, w)
    logp(w[3] * sigm.(w[1] * pred .+ w[2]) .+ w[4])
end

const fee_rate = 1 - 0.0005 # actual fee is 0.00015

# default trading is 1 BTC, which is 0.1 BTC with 10x leverage.
function walk_profit(w, ap)
    balance, position = 0, 0 # the virtual balance in the deliver time. we don't track the current equity

    open_long(price) = if position <= 0
        close_short(price)
        balance -= price
        position += fee_rate
    end

    open_short(price) = if position >= 0
        close_long(price)
        balance += price * fee_rate
        position -= 1
    end

    close_long(price) = if position > 0
        balance += position * price
        position = 0
    end

    close_short(price) = if position < 0
        balance += position * price
        position = 0
    end

    p = mapfoldl(+, ap) do x
        acts, price = x
        act = sample(1:5, pweights(exp.(getval(acts)) .+ .01))
        act == 1 ? open_long(price)   :
        act == 2 ? close_short(price) :
        act == 4 ? close_long(price)  :
        act == 5 ? open_short(price)  : 0
        acts[act]
    end

    p, balance + position * cadr(ap[end])
end

function dicide_segment(data, w)
    d = sample(data, pweights(length.(data) .- 29))
    i = rand(30:length(d))
    [(decide(car(x), w), cadr(x)) for x in d[i-29:i]]
end

function walk_loss(w, data, total_balance)
    ap = dicide_segment(data, w)
    seq = [walk_profit(w, ap) for i in 1:20]
    mb = mean(cadr.(seq))
    total_balance[] += mb
    sum([p * (balance - mb) for (p, balance) in seq])
end

function train_policy(w, data, nepoch=40_000, μ=.000005)
    g = grad(walk_loss)
    total_balance = Ref(0.)
    tic()

    for epoch in 1:nepoch
        w′ = g(w, data, total_balance)
        w .+= μ * w′

        if epoch % 1000 == 0
            # L2 Regularization except for the last batch
            for x in w @when epoch != nepoch
                x .-= .0001x
            end

            print("epoch: $epoch, balance: $(10total_balance[]), ") # * 10000 to get the actual quantity in USD
            toc(); tic()

            total_balance[] = 0
        end
    end
end
