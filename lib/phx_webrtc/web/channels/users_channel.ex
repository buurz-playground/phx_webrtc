defmodule PhxWebrtc.Web.UsersChannel do
  use PhxWebrtc.Web, :channel

  alias PhxWebrtc.Web.Presence

  def join("audio_calls:" <> session_token, _params, socket) do
    send(self(), :after_join)
    {:ok, assign(socket, :session_token, session_token) }
  end

  def handle_info(:after_join, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.user_id, %{})

    chat_with = socket
                |> Presence.list()
                |> Enum.filter(fn({key, _val}) -> key != socket.assigns.user_id end)
                |> List.first()

    if chat_with do
      { user_id, _ } = chat_with
      broadcast socket, "chat_start", %{room: "call:#{socket.assigns.user_id},#{user_id}",
                                        users: [socket.assigns.user_id, user_id],
                                        initiator: socket.assigns.user_id
                                       }
    end

    {:noreply, socket}
  end
end
