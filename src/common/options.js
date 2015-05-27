
var UstreamBouyomiOptions = {

  init: function() {

    UstreamBouyomiOptions.load();

    $('#save').click(function(event) {
      UstreamBouyomiOptions.save();
    });
  },

  save: function() {
    kango.invokeAsync('kango.storage.setItem', 'host', $('#host').val());
    kango.invokeAsync('kango.storage.setItem', 'port', $('#port').val());
  },

  load: function() {
    kango.invokeAsync('kango.storage.getItem', 'host', function(value) {
      $('#host').val(value || '');
    });
    kango.invokeAsync('kango.storage.getItem', 'port', function(value) {
      $('#port').val(value || '');
    });
  }

};

KangoAPI.onReady(function() {
  UstreamBouyomiOptions.init();
});
