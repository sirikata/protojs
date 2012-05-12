/*  ProtoJS Parsing Grammar
 *  ProtoJS.g
 *
 *  Copyright (c) 2009, Daniel Reiter Horn
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are
 *  met:
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in
 *    the documentation and/or other materials provided with the
 *    distribution.
 *  * Neither the name of Sirikata nor the names of its contributors may
 *    be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

grammar ProtoJS;

options
{
    output = AST;
    language = C;
    ASTLabelType = pANTLR3_BASE_TREE;
}

tokens
{
    PROTO;
}

scope NameSpace {
    struct LanguageOutputStruct* output;
    pANTLR3_STRING filename;
    pANTLR3_STRING externalNamespace;
    pANTLR3_STRING internalNamespace;
    pANTLR3_STRING package;
    pANTLR3_STRING packageDot;
    pANTLR3_STRING jsPackageDefinition;
    pANTLR3_LIST imports;
    pANTLR3_HASH_TABLE qualifiedTypes;
    int isPBJ;
    void*parent;
}

scope Symbols {
    pANTLR3_STRING message;
    pANTLR3_LIST required_advanced_fields;
    pANTLR3_HASH_TABLE types;
    pANTLR3_HASH_TABLE flag_sizes;
    pANTLR3_HASH_TABLE enum_sizes;
    pANTLR3_HASH_TABLE flag_values;
    pANTLR3_HASH_TABLE flag_all_on;
    pANTLR3_HASH_TABLE enum_values;
    int *reserved_range_start;
    int *reserved_range_end;
    int num_reserved_ranges;
    int *extension_range_start;
    int *extension_range_end;
    int num_extension_ranges;
    struct CsStreams *cs_streams;
}

@members {
    #include "ProtoJSParseUtil.h"
}
protocol
    scope Symbols;
    @init {
        initSymbolTable(SCOPE_TOP(Symbols),NULL,0);
    }
    : protoroot -> STRING_LITERAL["\"use strict\""] ITEM_TERMINATOR[";"] WS["\n"] IDENTIFIER[$NameSpace::jsPackageDefinition->chars] protoroot
    ;

protoroot
    scope NameSpace;
    @init {
        initNameSpace(ctx,SCOPE_TOP(NameSpace));
    }
	:	pbj_header? (importrule|message|service|enum_def|flags_def|option_assignment)* (package (importrule|message|service|enum_def|flags_def|option_assignment)*)?
    {
    }
	;
pbj_header : (STRING_LITERAL -> IDENTIFIER[$NameSpace::packageDot->chars] IDENTIFIER["_PBJ_Internal"] EQUALS["="] STRING_LITERAL ITEM_TERMINATOR[";"] WS["\n"])
    {
            if (strncmp((char*)$STRING_LITERAL.text->chars,"\"pbj-0.0.3\"",9)==0&&$STRING_LITERAL.text->chars[9]<='9'&&$STRING_LITERAL.text->chars[9]>='3') {
                
            }else {

                fprintf(stderr,"error: line \%d: pbj version \%s not understood--this compiler understands \"pbj-0.0.3\"\n",$STRING_LITERAL->line,$STRING_LITERAL.text->chars);  
            }
            $NameSpace::isPBJ=1;
    }
    ;
package
    
    : ( PACKAGELITERAL packagename ITEM_TERMINATOR -> WS["\n"])
        {
            jsPackageDefine($NameSpace::jsPackageDefinition,$packagename.text);
        }
	;
packagename : QUALIFIEDIDENTIFIER
    {
            definePackage( ctx, $QUALIFIEDIDENTIFIER.text);
    }
    |  IDENTIFIER
    {
            definePackage( ctx, $IDENTIFIER.text);
    }
    ;
importrule
   :   ( IMPORTLITERAL STRING_LITERAL ITEM_TERMINATOR -> COMMENT["//"] IMPORTLITERAL WS[" "] STRING_LITERAL ITEM_TERMINATOR WS["\n"] )
        {
            defineImport( ctx, $STRING_LITERAL.text );
        }
	;

service: (SERVICE IDENTIFIER BLOCK_OPEN service_block* BLOCK_CLOSE -> )
  {
     fprintf(stderr,"warning: ignoring service \%s\n",$IDENTIFIER.text->chars);
  };
service_block : RPC IDENTIFIER PAREN_OPEN service_args? PAREN_CLOSE RETURNS PAREN_OPEN IDENTIFIER PAREN_CLOSE ITEM_TERMINATOR ;

service_args :IDENTIFIER (COMMA service_args)? ;

//NOBRACE* ( BLOCK_OPEN service_block BLOCK_CLOSE NOBRACE*)? {};
message
    scope {
        int isExtension;        
        pANTLR3_STRING messageName;
    }    
    :   ( message_not_extend message_identifier BLOCK_OPEN (at_least_one_message_element)? BLOCK_CLOSE 
           -> {ctx->pProtoJSParser_SymbolsStack_limit<=1}?
                  IDENTIFIER[$NameSpace::packageDot->chars] message_identifier WS[" "] EQUALS["="] WS[" "] QUALIFIEDIDENTIFIER["PROTO.Message"] PAREN_OPEN["("] QUOTE["\""] QUALIFIEDIDENTIFIER[qualifyType(ctx,$message_not_extend.text,$message_identifier.text)] QUOTE["\""] COMMA[","] BLOCK_OPEN WS["\n"] at_least_one_message_element BLOCK_CLOSE PAREN_CLOSE[")"] ITEM_TERMINATOR[";"] WS["\n"]
                  -> message_identifier WS[" "] COLON[":"] WS[" "] QUALIFIEDIDENTIFIER["PROTO.Message"] PAREN_OPEN["("] QUOTE["\""] QUALIFIEDIDENTIFIER[qualifyType(ctx,$message_not_extend.text,$message_identifier.text)] QUOTE["\""] COMMA[","] BLOCK_OPEN WS["\n"] at_least_one_message_element BLOCK_CLOSE PAREN_CLOSE[")"] WS["\n"] )
        {
            if(!$message::isExtension) {
                defineType( ctx, $message::messageName ,TYPE_ISMESSAGE);
            }
            stringFree($message::messageName);
        }

        |   ( extend_not_message message_identifier BLOCK_OPEN (at_least_one_message_element)? BLOCK_CLOSE 
           -> IDENTIFIER[$NameSpace::packageDot->chars] message_identifier WS[" "] EQUALS["="] WS[" "] QUALIFIEDIDENTIFIER["PROTO.Extend"] PAREN_OPEN["("] QUALIFIEDIDENTIFIER[qualifyType(ctx,$extend_not_message.text,$message_identifier.text)] COMMA[","] BLOCK_OPEN WS["\n"] at_least_one_message_element BLOCK_CLOSE PAREN_CLOSE[")"] ITEM_TERMINATOR[";"] WS["\n"] )
        {
            if(!$message::isExtension) {
                defineType( ctx, $message::messageName ,TYPE_ISMESSAGE);
            }
            stringFree($message::messageName);
        }
	;

message_not_extend : 
        MESSAGE {$message::isExtension=0;}
        ;

extend_not_message : 
        EXTEND {$message::isExtension=1;}
        ;

message_identifier
    : IDENTIFIER
    {
        $message::messageName=stringDup($IDENTIFIER.text);
        if ($message::isExtension) {
            defineExtension(ctx, $message::messageName);
        }else {
            defineMessage(ctx, $message::messageName);
        }
    }
    ;

at_least_one_message_element
    scope Symbols;
    @init
    {
        initSymbolTable(SCOPE_TOP(Symbols), $message::messageName, $message::isExtension);  
    }
	:	(extensions|reservations)* message_element zero_or_more_message_elements
    {
        if($message::isExtension) {
            defineExtensionEnd(ctx, $message::messageName);
        }else {
            defineMessageEnd(ctx, $message::messageName);
        }
    }
    ;
zero_or_more_message_elements : (newline_message_element|extensions|reservations|option_assignment)*;


newline_message_element
	:	(field -> COMMA[","] WS["\n"] field)
	|	(message -> COMMA[","] WS["\n"] message)
	|	(enum_def -> COMMA[","] WS["\n"] enum_def)
	|	(flags_def -> COMMA[","] WS["\n"] flags_def)
    ;

message_element
	:	field
	|	message
	|	enum_def
	|	flags_def
	;

extensions
        : 
        ( EXTENSIONS integer TO integer_inclusive ITEM_TERMINATOR -> WS[""] ) //WS["\t"] EXTENSIONS WS[" "] integer WS[" "] TO WS[" "] integer_inclusive ITEM_TERMINATOR WS["\n"] 
        {
            defineExtensionRange(ctx, $integer.text, $integer_inclusive.text);
        }
        ;

reservations : (RESERVE integer TO integer_inclusive ITEM_TERMINATOR -> WS[""])
        {
            defineReservedRange(ctx, $integer.text, $integer_inclusive.text);
        }
        ;

integer_inclusive : integer 
        {
            
        }
        ;

enum_def
    scope {
        pANTLR3_STRING enumName;
        pANTLR3_LIST enumList;
    }
    @init {
        $enum_def::enumList=antlr3ListNew(1);
    }
	:	( ENUM enum_identifier BLOCK_OPEN at_least_one_enum_element BLOCK_CLOSE 
           -> {ctx->pProtoJSParser_SymbolsStack_limit<=1}?
             QUALIFIEDIDENTIFIER[qualifyType(ctx,$ENUM.text,$enum_def::enumName)] COLON["="] WS[" "] QUALIFIEDIDENTIFIER["PROTO.Enum"] PAREN_OPEN["("] QUOTE["\""] QUALIFIEDIDENTIFIER[qualifyType(ctx,$ENUM.text,$enum_def::enumName)] QUOTE["\""] COMMA[","] BLOCK_OPEN WS["\n"] at_least_one_enum_element BLOCK_CLOSE PAREN_CLOSE[")"] ITEM_TERMINATOR[";"] WS["\n"]
              -> WS["\t"] enum_identifier COLON[":"] WS[" "] QUALIFIEDIDENTIFIER["PROTO.Enum"] PAREN_OPEN["("] QUOTE["\""] QUALIFIEDIDENTIFIER[qualifyType(ctx,$ENUM.text,$enum_def::enumName)] QUOTE["\""] COMMA[","] BLOCK_OPEN WS["\n"] at_least_one_enum_element WS["\t"] BLOCK_CLOSE PAREN_CLOSE[")"] )
        {
            defineEnum( ctx, $enum_def::enumName, $enum_def::enumList);
            $enum_def::enumList->free($enum_def::enumList);
            stringFree($enum_def::enumName);
        }
	;
at_least_one_enum_element : enum_element zero_or_more_enum_elements;
zero_or_more_enum_elements : (enum_element* -> (WS[","] WS["\n"] enum_element)*);

enum_element
	:	(IDENTIFIER EQUALS integer ITEM_TERMINATOR -> WS["\t"] WS["\t"] IDENTIFIER WS[" "] COLON[":"] integer )
        {
            defineEnumValue( ctx, $enum_def::enumName, $enum_def::enumList, $IDENTIFIER.text, $integer.text );
        }
	;
enum_identifier
    : IDENTIFIER
      {
            $enum_def::enumName=stringDup($IDENTIFIER.text);
      }
      ;

flags_def
    scope
    {
        pANTLR3_STRING flagName;
        pANTLR3_LIST flagList;
        int flagBits;
    }
    @init {
        $flags_def::flagList=antlr3ListNew(1);
        
    }
	:	( flags flag_identifier BLOCK_OPEN at_least_one_flag_element BLOCK_CLOSE 
           -> {ctx->pProtoJSParser_SymbolsStack_limit<=1}?
             QUALIFIEDIDENTIFIER[qualifyType(ctx,$flags.text,$flags_def::flagName)] COLON["="] WS[" "] QUALIFIEDIDENTIFIER["PROTO.Flags"] PAREN_OPEN["("] DECIMAL_LITERAL["123456"] COMMA[","] QUOTE["\""] QUALIFIEDIDENTIFIER[qualifyType(ctx,$flags.text,$flags_def::flagName)] QUOTE["\""] COMMA[","] BLOCK_OPEN at_least_one_flag_element BLOCK_CLOSE PAREN_CLOSE[")"] ITEM_TERMINATOR[";"] WS["\n"]
           -> WS["\t"] flag_identifier COLON[":"] WS[" "] QUALIFIEDIDENTIFIER["PROTO.Flags"] PAREN_OPEN["("] DECIMAL_LITERAL["123456"] COMMA[","] QUOTE["\""] QUALIFIEDIDENTIFIER[qualifyType(ctx,$flags.text,$flags_def::flagName)] QUOTE["\""] COMMA[","] BLOCK_OPEN WS["\n"]  at_least_one_flag_element BLOCK_CLOSE PAREN_CLOSE[")"] )
        {
            defineFlag( ctx, $flags_def::flagName, $flags_def::flagList, $flags_def::flagBits);
            $flags_def::flagList->free($flags_def::flagList);
            stringFree($flags_def::flagName);
        }
	;

flag_identifier 
	:	IDENTIFIER
        {
            $flags_def::flagName=stringDup($IDENTIFIER.text);
        }
	;
at_least_one_flag_element: flag_element zero_or_more_flag_elements;

zero_or_more_flag_elements : (flag_element* -> (COMMA[","] WS["\n"] flag_element)*);
flag_element
	:	( IDENTIFIER EQUALS integer ITEM_TERMINATOR -> WS["\t"] WS["\t"] IDENTIFIER WS[" "] COLON[":"] WS[" "] integer)
        {
            defineFlagValue( ctx, $flags_def::flagName, $flags_def::flagList, $IDENTIFIER.text , $integer.text);
        }
	;

field
    scope{
        pANTLR3_STRING fieldType;
        pANTLR3_STRING fieldName;
        ///protobuf value if it is an advanced_type or default kind of type...  C++ value if it's a multiplicitve type
        pANTLR3_STRING defaultValue;
        int fieldOffset;
        int isNumericType;
        int isRepeated;
        int isRequired;
    }
    @init {$field::defaultValue=NULL; $field::isNumericType=0;$field::isRepeated=0;$field::isRequired=0;}
    :
      ( ( multiplicity (multiplicitive_type|field_type) field_name EQUALS field_offset (default_value|none) ITEM_TERMINATOR )  
       -> WS["\t"] field_name COLON[":"] WS[" "] BLOCK_OPEN["{"] WS["\n\t\t"] IDENTIFIERCOLON["options:"] WS[" "] default_value none COMMA[","] WS["\n\t\t"] IDENTIFIERCOLON["multiplicity:"] WS[" "] QUALIFIEDIDENTIFIER["PROTO."] multiplicity COMMA[","] WS["\n\t\t"] IDENTIFIERCOLON["type:"] WS[" "] IDENTIFIER["function"] PAREN_OPEN["("]PAREN_CLOSE[")"] BLOCK_OPEN["{"] IDENTIFIER["return"] WS[" "] multiplicitive_type field_type ITEM_TERMINATOR[";"] BLOCK_CLOSE["}"] COMMA[","] WS["\n\t\t"] IDENTIFIERCOLON["id:"] WS[" "] field_offset WS["\n\t"] BLOCK_CLOSE["}"] )
    { 
        if (($field::isRepeated||$field::isRequired)&&$field::defaultValue&&$field::defaultValue->len) {
           fprintf(stderr,"error: line \%d: default not allowed for repeated or optional elements in field \%s : \%s\n",$ITEM_TERMINATOR.line,$field::fieldName->chars,$field::defaultValue->chars);
        }
        defineField(ctx, $field::fieldType,$field::fieldName,$field::defaultValue,$field::fieldOffset,$field::isRepeated==0,$field::isRequired,0);
        stringFree($field::fieldName);
        stringFree($field::fieldType);
        stringFree($field::defaultValue);
    }
	;

multiplicity : (ProtoJSOPTIONAL){}
    |(REQUIRED) 
    { $field::isRequired=1;} 
               |(REPEATED) 
    {
            $field::isRepeated=1;
    }
	;


none : (DOT?)->IDENTIFIER[($field::isNumericType||isPackable(ctx,$field::fieldType))&&$field::isRepeated&&$NameSpace::isPBJ?"{packed:true}":"{}"] ;
field_offset
    : integer
    {
        
        $field::fieldOffset=atoi((char*)($integer.text->chars));
    }
    ;

field_name
    : IDENTIFIER
    {
        $field::fieldName=stringDup($IDENTIFIER.text);
    }
    ;

field_type
    : (numeric_type ->QUALIFIEDIDENTIFIER["PROTO."] numeric_type)
    {
        $field::isNumericType=1;
        $field::fieldType=stringDup($numeric_type.text);
    }
    | (floating_point_type -> QUALIFIEDIDENTIFIER["PROTO."] FLOAT["Float"])
    {
        $field::isNumericType=1;
        $field::fieldType=stringDup($floating_point_type.text);
        $field::fieldType->set8($field::fieldType,"Float");
    }
    | (double_floating_point_type -> QUALIFIEDIDENTIFIER["PROTO."] DOUBLE["Double"])
    {
        $field::isNumericType=1;
        $field::fieldType=stringDup($double_floating_point_type.text);
        $field::fieldType->set8($field::fieldType,"Double");
    }
    | (array_type -> QUALIFIEDIDENTIFIER["PROTO."] array_type)
    {
        $field::isNumericType=0;
        $field::fieldType=stringDup($array_type.text);
    }
    | (advanced_numeric_type -> QUALIFIEDIDENTIFIER["PBJ."] advanced_numeric_type)
    {
       $field::isNumericType=1;
       $field::fieldType=stringDup($advanced_numeric_type.text);
    }
    | (advanced_array_type -> QUALIFIEDIDENTIFIER["PBJ."] advanced_array_type)
    {
       $field::isNumericType=0;
       $field::fieldType=stringDup($advanced_array_type.text);
    }
    | ( type_identifier ->  QUALIFIEDIDENTIFIER[qualifyType( ctx, $type_identifier.text, $type_identifier.text )] )
    {
       $field::isNumericType=(isEnum(ctx,$type_identifier.text)||
                              isFlag(ctx,$type_identifier.text));
       $field::fieldType=stringDup($type_identifier.text);
    }
    ;

type_identifier
    : IDENTIFIER | QUALIFIEDIDENTIFIER
    ;
multiplicitive_type
    : 
    (multiplicitive_advanced_type -> QUALIFIEDIDENTIFIER["PBJ."] multiplicitive_advanced_type)
    {
       $field::fieldType=stringDup($multiplicitive_advanced_type.text);
       $field::isNumericType=1;
       $field::isRepeated=1;
    }
    ;

array_spec
	:	SQBRACKET_OPEN integer? SQBRACKET_CLOSE
	;
option_assignment
    :
    (OPTION_LITERAL PAREN_OPEN? IDENTIFIER PAREN_CLOSE? EQUALS option_assignment_value ITEM_TERMINATOR -> )
    {
            if (strcmp($IDENTIFIER.text->chars,"java_package")!=0&&
                strcmp($IDENTIFIER.text->chars,"java_outer_classname")!=0&&
                strcmp($IDENTIFIER.text->chars,"java_multiple_files")!=0&&
                strcmp($IDENTIFIER.text->chars,"optimize_for")!=0) {
                fprintf(stderr,"Warning: Unrecognized option \%s\n",$IDENTIFIER.text->chars);
            }
                
    }
    ;

option_assignment_value: (literal_value|QUALIFIEDIDENTIFIER|IDENTIFIER) {};
default_value
	:	
    (SQBRACKET_OPEN option_pairs SQBRACKET_CLOSE -> 
     {($field::isNumericType||isPackable(ctx,$field::fieldType))&&$field::isRepeated&&$NameSpace::isPBJ}?  BLOCK_OPEN["{"] option_pairs COMMA[","] IDENTIFIER["packed"] COLON[":"] BOOL_LITERAL["true"] BLOCK_CLOSE["}"]
     ->  BLOCK_OPEN["{"] option_pairs BLOCK_CLOSE["}"])
    ;

option_pairs 
    : 
    option_pair (COMMA option_pair)*
    ;

option_pair 
    scope {pANTLR3_STRING literalValue;}
    : 
    (DEFAULT EQUALS default_literal_value -> DEFAULT["default_value"] COLON[":"] STRING_LITERAL[$default_literal_value.text->setS($default_literal_value.text,$field::defaultValue)])
    |
    (IDENTIFIER EQUALS option_literal_value 
       -> {strcmp((char*)$IDENTIFIER.text->chars,"packed")==0&&$NameSpace::isPBJ}? 
           IDENTIFIER["_packed"] COLON[":"] BOOL_LITERAL["true"]
       -> IDENTIFIER COLON[":"] STRING_LITERAL[$option_pair.text->setS($option_pair.text,$option_pair::literalValue)])
  {
     if (strcmp((char*)$IDENTIFIER.text->chars,"packed")==0&&$NameSpace::isPBJ) {
         fprintf(stderr,"error: line \%d: packed not allowed in pbj, forcing true, overriding _packed in \%s : \%s\n",$IDENTIFIER.line,$Symbols::message->chars, $field::fieldName->chars);
     }
  }
  ;

option_literal_value : literal_value {
        $option_pair::literalValue=defaultValuePreprocess(ctx, NULL, $literal_value.text);
   }
   ;

default_literal_value : literal_value
  {
        $field::defaultValue=defaultValuePreprocess(ctx, $field::fieldType, $literal_value.text);
  }
    |
  IDENTIFIER
  {
        $field::defaultValue=defaultValueIdentifierPreprocess(ctx, $field::fieldType, $IDENTIFIER.text);
  }
  ;

floating_point_type : FLOAT;
double_floating_point_type:	DOUBLE;
numeric_type:		UINT32
	|	INT32
	|	SINT32
	|	FIXED32
	|	SFIXED32
	|	UINT64
	|	INT64
	|	SINT64
	|	FIXED64
	|	SFIXED64
	|	BOOL
	;
array_type:	STRING
	|	BYTES
	;

multiplicitive_advanced_type 
    :   NORMAL 
    |   VECTOR2F
    |   VECTOR2D
    |   VECTOR3F
    |   VECTOR3D
    |   VECTOR4F
    |   VECTOR4D
    |   UNITQUATERNION 
    |   QUATERNION 
    |   BOUNDINGSPHERE3F 
    |   BOUNDINGSPHERE3D 
    |   BOUNDINGBOX3F3F 
    |   BOUNDINGBOX3D3F 
    ;

advanced_numeric_type:	UINT8 
	|	INT8 
	|	SINT8
	|	FIXED8
	|	SFIXED8
	|	INT16 
	|	SINT16 
	|	FIXED16
	|	SFIXED16
    |   UINT16 
    |   ANGLE 
    |   TIME 
    |   DURATION 
    ; 

advanced_array_type:	   UUID 
    |   SHA256 
    ; 

literal_value
	:	HEX_LITERAL
    |   DECIMAL_LITERAL
    |   OCTAL_LITERAL
    |   FLOATING_POINT_LITERAL
    |   BOOL_LITERAL
    |   STRING_LITERAL
    ;

PACKAGELITERAL :    'package';
IMPORTLITERAL :     'import';

DOT :  '.';
// Message elements
SERVICE : 'service';
RPC : 'rpc';
RETURNS : 'returns';
MESSAGE	:	'message';
EXTEND	:	'extend';
EXTENSIONS : 'extensions';
RESERVE : 'reserve';
TO : 'to';
// Enum elements
ENUM	:	'enum';

flags : 
     FLAGS8
     {
        $flags_def::flagBits=8;
     }
     |
     FLAGS16
     {
        $flags_def::flagBits=16;
     }
     |
     FLAGS32
     {
        $flags_def::flagBits=32;
     }
     |
     FLAGS64
     {
        $flags_def::flagBits=64;
     }

     ;
// Flags elements
FLAGS8	:	'flags8';
FLAGS16	:	'flags16';
FLAGS32	:	'flags32';
FLAGS64	:	'flags64';

// Field elements
REQUIRED:	'required';
ProtoJSOPTIONAL:	'optional';
REPEATED:	'repeated';

DEFAULT	:	'default';


EQUALS	:	'=';

// Common block elements
BLOCK_OPEN	:	'{';
BLOCK_CLOSE	:	'}';

ITEM_TERMINATOR
	:	';';

// Type elements
UINT8	:	'uint8';
INT8	:	'int8';
SINT8	:	'sint8';
FIXED8	:	'fixed8';
SFIXED8	:	'sfixed8';
UINT16	:	'uint16';
INT16	:	'int16';
SINT16	:	'sint16';
FIXED16	:	'fixed16';
SFIXED16:	'sfixed16';
UINT32	:	'uint32';
INT32	:	'int32';
SINT32	:	'sint32';
FIXED32	:	'fixed32';
SFIXED32:	'sfixed32';
UINT64	:	'uint64';
INT64	:	'int64';
SINT64	:	'sint64';
FIXED64	:	'fixed64';
SFIXED64:	'sfixed64';
FLOAT	:	'float';
DOUBLE	:	'double';
BOOL	:	'bool';
BYTES   :   'bytes';
STRING   :   'string';

UUID : 'uuid';
SHA256 : 'sha256';
ANGLE : 'angle';
TIME : 'time';
DURATION : 'duration';
NORMAL : 'normal';
VECTOR2F : 'vector2f';
VECTOR2D : 'vector2d';
VECTOR3F : 'vector3f';
VECTOR3D : 'vector3d';
VECTOR4F : 'vector4f';
VECTOR4D : 'vector4d';
UNITQUATERNION : 'unitquaternion';
QUATERNION : 'quaternion';
BOUNDINGSPHERE3F : 'boundingsphere3f';
BOUNDINGSPHERE3D : 'boundingsphere3d';
BOUNDINGBOX3F3F : 'boundingbox3f3f';
BOUNDINGBOX3D3F : 'boundingbox3d3f';


SQBRACKET_OPEN	:	'[';
SQBRACKET_CLOSE	:	']';

integer
    : DECIMAL_LITERAL
    | HEX_LITERAL
    | OCTAL_LITERAL
    ;

STRING_LITERAL
    :  '"' STRING_GUTS '"'
    ;

fragment
STRING_GUTS :	( EscapeSequence | ~('\\'|'"') )* ;
OPTION_LITERAL
     : 'option';
BOOL_LITERAL
    : 'true'
    | 'false'
    ;

HEX_LITERAL : '0' ('x'|'X') HexDigit+ ;

DECIMAL_LITERAL : ('0' | '-'? '1'..'9' '0'..'9'*) ;

OCTAL_LITERAL : '0' ('0'..'7')+ ;

fragment
HexDigit : ('0'..'9'|'a'..'f'|'A'..'F') ;


FLOATING_POINT_LITERAL
    :   ('0'..'9')+ '.' ('0'..'9')* Exponent?
    |   '.' ('0'..'9')+ Exponent?
    |   ('0'..'9')+ Exponent
    ;

fragment
Exponent : ('e'|'E') ('+'|'-')? ('0'..'9')+ ;


fragment
EscapeSequence
    :   '\\' ('b'|'t'|'n'|'f'|'r'|'\"'|'\''|'\\')
    |   OctalEscape
    ;

fragment
OctalEscape
    :   '\\' ('0'..'3') ('0'..'7') ('0'..'7')
    |   '\\' ('0'..'7') ('0'..'7')
    |   '\\' ('0'..'7')
    ;

fragment
UnicodeEscape
    :   '\\' 'u' HexDigit HexDigit HexDigit HexDigit
    ;


IDENTIFIER : ('a'..'z' |'A'..'Z' |'_' ) ('a'..'z' |'A'..'Z' |'_' |'0'..'9' )* ;


QUALIFIEDIDENTIFIER : ('a'..'z' |'A'..'Z' |'_' ) ('a'..'z' |'A'..'Z' |'_' | '.' |'0'..'9' )* ;

IDENTIFIERCOLON : ('a'..'z' |'A'..'Z' |'_' ) ('a'..'z' |'A'..'Z' |'_' | '0'..'9' )* ':';

COMMENT	: '//' .* '\n' {$channel=HIDDEN;}
        | '/*' ( options {greedy=false;} : . )* '*/' {$channel=HIDDEN;}
        ;

WS       : (' '|'\t'|'\n'|'\r')+ {$channel=HIDDEN;} ;

PAREN_OPEN : '(' ;

PAREN_CLOSE : ')' ;

QUOTE : '"' ;

COMMA : ',' ;

COLON : ':' ;


