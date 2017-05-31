require IEx
defmodule PhxWebrtc.Web.PageController do
  use PhxWebrtc.Web, :controller

  alias PhxWebrtc.KeyStore.Session

  def index(conn, params) do
    case Session.fetch params["token"] do
      false -> render(conn, "index.html")
      true -> render(conn, "index.html", session_token: params["token"])
    end
  end
end
