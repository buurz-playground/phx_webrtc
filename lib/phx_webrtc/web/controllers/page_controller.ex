defmodule PhxWebrtc.Web.PageController do
  use PhxWebrtc.Web, :controller

  def index(conn, params) do
    render conn, "index.html", session_token: params["token"]
  end
end
