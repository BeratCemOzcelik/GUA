FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["GUA.Api/GUA.Api.csproj", "GUA.Api/"]
COPY ["GUA.Core/GUA.Core.csproj", "GUA.Core/"]
COPY ["GUA.Infrastructure/GUA.Infrastructure.csproj", "GUA.Infrastructure/"]
COPY ["GUA.Shared/GUA.Shared.csproj", "GUA.Shared/"]
RUN dotnet restore "GUA.Api/GUA.Api.csproj"
COPY . .
WORKDIR "/src/GUA.Api"
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

# Create uploads directory
RUN mkdir -p /app/wwwroot/uploads

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "GUA.Api.dll"]
