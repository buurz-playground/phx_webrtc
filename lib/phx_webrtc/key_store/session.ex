defmodule PhxWebrtc.KeyStore.Session do
  def start_link do
    IO.puts "ETS initialize !"
    :ets.new(:session_keys, [:set, :public, :named_table])
    :ets.insert_new(:session_keys, { "123123", 120 } )
  end

  def put(key, ttl) do
    :ets.insert_new(:session_keys, { key, ttl } )
  end

  def fetch(key) do
    case :ets.lookup(:session_keys, key) do
      [] -> false
      [_] -> true
    end
  end

  def destroy(key) do
    :ets.delete(:session_keys, key)
  end
end
