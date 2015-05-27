var channel, m1, m2;
m1 = location.href.match(/(http|https)+:\/\/(www\.)*ustream\.tv\/channel\/(.+)/i);
if (m1 && m1.length >= 3) {
  channel = m1[3];
  var m2 = channel.match(/(.*)\?.+/i)
  if (m2 && m2.length >= 1) {
    channel = m2[1];
  }
}
var data = {
  channel: channel
};
kango.dispatchMessage("register", data);
