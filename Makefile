INPUTDIR=protocol
OUTPUTDIR=output

ifeq ($(uname),Darwin)
FLAGS += -arch i386
endif

ALLSOURCES=$(wildcard $(INPUTDIR)/*.pbj) $(wildcard $(INPUTDIR)/*.proto)
ALLOUTPUTS=$(patsubst $(INPUTDIR)/%,$(OUTPUTDIR)/%.js,$(ALLSOURCES))
ANTLRVER=3.2

all: $(ALLOUTPUTS) pbj

$(OUTPUTDIR)/%.proto.js: $(INPUTDIR)/%.proto pbj
	@mkdir $(OUTPUTDIR) 2>/dev/null || true
	./pbj $< $@

$(OUTPUTDIR)/%.pbj.js: $(INPUTDIR)/%.pbj pbj
	@mkdir $(OUTPUTDIR) 2>/dev/null || true
	./pbj $< $@

pbj : main.cpp ProtoJSLexer.o ProtoJSParser.o ProtoJSParseUtil.o
	g++ $(FLAGS) -std=c++98 -Wall -static -g -o pbj -Iantlr-$(ANTLRVER)/include -Lantlr-$(ANTLRVER)/lib -I/usr/local/include -L/usr/local/lib main.cpp ProtoJSLexer.o ProtoJSParser.o ProtoJSParseUtil.o -lantlr3c || \
        g++ $(FLAGS) -g -o pbj -Iantlr-$(ANTLRVER)/include -Lantlr-$(ANTLRVER)/lib -I/usr/local/include -L/usr/local/lib main.cpp ProtoJSLexer.o ProtoJSParser.o ProtoJSParseUtil.o antlr-$(ANTLRVER)/lib/libantlr3c.a || \
        g++ $(FLAGS) -g -o pbj -Iantlr-$(ANTLRVER)/include -Lantlr-$(ANTLRVER)/lib main.cpp ProtoJSLexer.o ProtoJSParser.o ProtoJSParseUtil.o -lantlr3c

ProtoJSLexer.c : ProtoJS.g
	java -jar antlr-$(ANTLRVER).jar ProtoJS.g

ProtoJSParser.c : ProtoJS.g
	java -jar antlr-$(ANTLRVER).jar ProtoJS.g

ProtoJSLexer.h : ProtoJS.g
	java -jar antlr-$(ANTLRVER).jar ProtoJS.g

ProtoJSParser.h : ProtoJS.g
	java -jar antlr-$(ANTLRVER).jar ProtoJS.g

ProtoJSLexer.o : ProtoJSLexer.h ProtoJSLexer.c
	gcc $(FLAGS) -c -g -Wall -Iantlr-$(ANTLRVER)/include -I/usr/local/include -o ProtoJSLexer.o ProtoJSLexer.c

ProtoJSParser.o : ProtoJSParser.h ProtoJSParser.c
	gcc $(FLAGS) -c -g -Wall -Iantlr-$(ANTLRVER)/include -I/usr/local/include -o ProtoJSParser.o ProtoJSParser.c

ProtoJSParseUtil.o : ProtoJSParseUtil.h ProtoJSParseUtil.cpp
	g++ $(FLAGS) -c -g -Wall -Iantlr-$(ANTLRVER)/include -I/usr/local/include -o ProtoJSParseUtil.o ProtoJSParseUtil.cpp

clean:
	rm -f ProtoJSParseUtil.o ProtoJSLexer.o ProtoJSParser.o ProtoJSLexer.c ProtoJSParser.c main.o
