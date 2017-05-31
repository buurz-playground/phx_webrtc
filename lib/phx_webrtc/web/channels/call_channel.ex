defmodule PhxWebrtc.Web.CallChannel do
  use PhxWebrtc.Web, :channel

  alias PhxWebrtc.Web.Presence

  def join("call:" <> callers, _payload, socket) do
    [caller_id, other_id] = String.split(callers, ",")

    if caller_id == socket.assigns.user_id || other_id == socket.assigns.user_id do
      send(self, :after_join)
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_info(:after_join, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.user_id, %{})

    {:noreply, socket}
  end

  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  def handle_in(signal, payload, socket) do
    case signal == "signal" do
      true ->
        broadcast socket, "signal:#{socket.assigns.user_id}", payload
      false ->
        IO.inspect %{signal: signal, payload: payload, socket: socket}
        broadcast socket, "signal:#{socket.assigns.user_id}", %{data: "bye"}
      end
    {:noreply, socket}
  end
end
