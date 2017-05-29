defmodule PhxWebrtc.Web.Presence do
  use Phoenix.Presence, otp_app: :phx_webrtc,
                        pubsub_server: PhxWebrtc.PubSub
end
