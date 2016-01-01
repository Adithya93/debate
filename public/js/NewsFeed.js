var content = document.getElementById('content');

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function(){
                if (xhr.readyState==4 && xhr.status==200)
                {
                    var data = JSON.parse(xhr.responseText);
                    if(data.status == 'ok'){

                        var output = '<h1>'+data.feed.title+'</h1>';

                        var limit = 3;

                        for(var i=0;i<data.items.length && i < limit;++i){

                            output += '<p><h2><a href="' +
                                    data.items[i].link + '" >' +
                                    data.items[i].title + '</h2></a></p>';

                        }


                        content.innerHTML = output;

                    }
                }
            };
        xhr.open('GET','http://rss2json.com/api.json?rss_url=http%3A%2F%2Fwww.economist.com%2Fsections%2Feconomics%2Frss.xml',true);
        xhr.send();